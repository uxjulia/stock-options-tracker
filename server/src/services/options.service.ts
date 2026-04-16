import db from "../config/database";
import {
  calcBreakeven,
  calcProceeds,
  calcStockDelta,
  calcDaysOpen,
} from "../utils/calculations";
import { getPrices } from "./tickers.service";
import type {
  OptionRow,
  OptionWithCalculations,
  CloseReason,
} from "../models/option.model";
import { HIDE_OLDER_THAN_DAYS } from "../config/constants";

export interface OptionFilters {
  account_id?: number;
  ticker?: string;
  option_type?: "call" | "put";
  direction?: "bought" | "sold";
  status?: "open" | "closed" | "all";
  show_old?: boolean;
  page?: number;
  limit?: number;
}

function attachCalculations(
  row: OptionRow & { account_name: string },
  priceData: Record<
    string,
    { price: number; isManualOverride: boolean; isStale: boolean } | null
  >
): OptionWithCalculations {
  const breakeven = calcBreakeven(
    row.option_type,
    row.strike_price,
    row.premium
  );
  const proceeds = calcProceeds(
    row.direction,
    row.premium,
    row.quantity,
    row.close_reason,
    row.cost_to_close
  );
  const days_open = calcDaysOpen(row.date_opened, row.date_closed);
  const priceInfo = priceData[row.ticker.toUpperCase()] ?? null;

  return {
    ...row,
    breakeven,
    proceeds,
    days_open,
    current_price: priceInfo?.price ?? null,
    price_is_manual: priceInfo?.isManualOverride ?? false,
    price_stale: priceInfo?.isStale ?? false,
  };
}

export async function listOptions(
  userId: number,
  filters: OptionFilters = {}
): Promise<{ data: OptionWithCalculations[]; total: number }> {
  const {
    account_id,
    ticker,
    option_type,
    direction,
    status = "open",
    show_old = false,
    page = 1,
    limit = 50,
  } = filters;

  const conditions: string[] = ["o.user_id = @userId"];
  const params: Record<string, unknown> = { userId };

  if (account_id) {
    conditions.push("o.account_id = @account_id");
    params.account_id = account_id;
  }
  if (ticker) {
    conditions.push("o.ticker LIKE @ticker");
    params.ticker = `%${ticker.toUpperCase()}%`;
  }
  if (option_type) {
    conditions.push("o.option_type = @option_type");
    params.option_type = option_type;
  }
  if (direction) {
    conditions.push("o.direction = @direction");
    params.direction = direction;
  }

  if (status === "open") {
    conditions.push("o.date_closed IS NULL");
  } else if (status === "closed") {
    conditions.push("o.date_closed IS NOT NULL");
  }

  if (!show_old && status !== "open") {
    // Hide closed options closed more than 30 days ago
    conditions.push(
      `(o.date_closed IS NULL OR
        julianday('now') - julianday(o.date_closed) <= @hide_days)`
    );
    params.hide_days = HIDE_OLDER_THAN_DAYS;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM options o ${whereClause}`)
    .get(params) as { total: number };

  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `SELECT o.*, a.name AS account_name
       FROM options o
       JOIN accounts a ON a.id = o.account_id
       ${whereClause}
       ORDER BY
         CASE WHEN o.date_closed IS NULL THEN 0 ELSE 1 END ASC,
         o.expiration_date ASC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset }) as (OptionRow & {
    account_name: string;
  })[];

  // Batch fetch prices for unique tickers
  const tickers = [...new Set(rows.map((r) => r.ticker.toUpperCase()))];
  const priceData = tickers.length > 0 ? await getPrices(tickers) : {};

  const data = rows.map((row) => attachCalculations(row, priceData));

  return { data, total: countRow.total };
}

export async function getOption(
  userId: number,
  optionId: number
): Promise<OptionWithCalculations | undefined> {
  const row = db
    .prepare(
      `SELECT o.*, a.name AS account_name
       FROM options o
       JOIN accounts a ON a.id = o.account_id
       WHERE o.id = ? AND o.user_id = ?`
    )
    .get(optionId, userId) as
    | (OptionRow & { account_name: string })
    | undefined;

  if (!row) return undefined;

  const priceData = await getPrices([row.ticker.toUpperCase()]);
  return attachCalculations(row, priceData);
}

export interface CreateOptionData {
  account_id: number;
  ticker: string;
  direction: "bought" | "sold";
  option_type: "call" | "put";
  strike_price: number;
  expiration_date: string;
  quantity: number;
  premium: number;
  date_opened: string;
  notes?: string;
}

export async function createOption(
  userId: number,
  data: CreateOptionData
): Promise<OptionWithCalculations> {
  const row = db
    .prepare(
      `INSERT INTO options
        (user_id, account_id, ticker, direction, option_type, strike_price,
         expiration_date, quantity, premium, date_opened, notes)
       VALUES
        (@userId, @account_id, @ticker, @direction, @option_type, @strike_price,
         @expiration_date, @quantity, @premium, @date_opened, @notes)
       RETURNING *`
    )
    .get({
      userId,
      account_id: data.account_id,
      ticker: data.ticker.toUpperCase(),
      direction: data.direction,
      option_type: data.option_type,
      strike_price: data.strike_price,
      expiration_date: data.expiration_date,
      quantity: data.quantity,
      premium: data.premium,
      date_opened: data.date_opened,
      notes: data.notes ?? null,
    }) as OptionRow;

  const account = db
    .prepare("SELECT name FROM accounts WHERE id = ?")
    .get(data.account_id) as { name: string };

  const priceData = await getPrices([data.ticker.toUpperCase()]);
  return attachCalculations({ ...row, account_name: account.name }, priceData);
}

export interface UpdateOptionData {
  account_id?: number;
  ticker?: string;
  direction?: "bought" | "sold";
  option_type?: "call" | "put";
  strike_price?: number;
  expiration_date?: string;
  quantity?: number;
  premium?: number;
  date_opened?: string;
  notes?: string;
  ignore_next_steps?: boolean;
}

export async function updateOption(
  userId: number,
  optionId: number,
  data: UpdateOptionData
): Promise<OptionWithCalculations | undefined> {
  const existing = db
    .prepare("SELECT * FROM options WHERE id = ? AND user_id = ?")
    .get(optionId, userId) as OptionRow | undefined;

  if (!existing) return undefined;

  const updated = db
    .prepare(
      `UPDATE options SET
        account_id        = @account_id,
        ticker            = @ticker,
        direction         = @direction,
        option_type       = @option_type,
        strike_price      = @strike_price,
        expiration_date   = @expiration_date,
        quantity          = @quantity,
        premium           = @premium,
        date_opened       = @date_opened,
        notes             = @notes,
        ignore_next_steps = @ignore_next_steps,
        updated_at        = datetime('now')
       WHERE id = @id AND user_id = @userId
       RETURNING *`
    )
    .get({
      account_id: data.account_id ?? existing.account_id,
      ticker: (data.ticker ?? existing.ticker).toUpperCase(),
      direction: data.direction ?? existing.direction,
      option_type: data.option_type ?? existing.option_type,
      strike_price: data.strike_price ?? existing.strike_price,
      expiration_date: data.expiration_date ?? existing.expiration_date,
      quantity: data.quantity ?? existing.quantity,
      premium: data.premium ?? existing.premium,
      date_opened: data.date_opened ?? existing.date_opened,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      ignore_next_steps:
        data.ignore_next_steps !== undefined
          ? data.ignore_next_steps
            ? 1
            : 0
          : existing.ignore_next_steps,
      id: optionId,
      userId,
    }) as OptionRow;

  const accountId = updated.account_id;
  const account = db
    .prepare("SELECT name FROM accounts WHERE id = ?")
    .get(accountId) as { name: string };

  const priceData = await getPrices([updated.ticker.toUpperCase()]);
  return attachCalculations(
    { ...updated, account_name: account.name },
    priceData
  );
}

export interface CloseOptionData {
  close_reason: CloseReason;
  date_closed: string;
  cost_to_close?: number;
  new_strike_price?: number;
  new_expiration_date?: string;
  new_premium?: number;
}

export async function closeOption(
  userId: number,
  optionId: number,
  data: CloseOptionData
): Promise<OptionWithCalculations | undefined> {
  const existing = db
    .prepare("SELECT * FROM options WHERE id = ? AND user_id = ?")
    .get(optionId, userId) as OptionRow | undefined;

  if (!existing) return undefined;
  if (existing.date_closed) return undefined; // already closed

  if (data.close_reason === "rolled") {
    if (data.new_expiration_date == null) {
      throw new Error("A new expiration date is required");
    }
    if (data.new_strike_price == null) {
      throw new Error("A new strike price is required");
    }
    if (data.new_premium == null) {
      throw new Error("A new premium is required");
    }
  }

  // Calculate stock delta for assigned options
  const stockDelta =
    data.close_reason === "assigned"
      ? calcStockDelta(
          existing.direction,
          existing.option_type,
          existing.quantity
        )
      : null;

  const costToClose =
    data.close_reason === "closed_early" || data.close_reason === "rolled"
      ? (data.cost_to_close ?? null)
      : null;

  const closeStmt = db.prepare(
    `UPDATE options SET
      date_closed          = @date_closed,
      close_reason         = @close_reason,
      cost_to_close        = @cost_to_close,
      stock_delta_applied  = @stock_delta_applied,
      updated_at           = datetime('now')
     WHERE id = @id AND user_id = @userId
     RETURNING *`
  );

  let updated: OptionRow;

  if (data.close_reason === "rolled") {
    const rollNetPremium = data.new_premium! - (data.cost_to_close ?? 0);

    const insertStmt = db.prepare(
      `INSERT INTO options
        (user_id, account_id, ticker, direction, option_type, strike_price,
         expiration_date, quantity, premium, date_opened,
         rolled_from_option_id, roll_net_premium, notes)
       VALUES
        (@userId, @account_id, @ticker, @direction, @option_type, @strike_price,
         @expiration_date, @quantity, @premium, @date_opened,
         @rolled_from_option_id, @roll_net_premium, @notes)`
    );

    updated = db.transaction(() => {
      const row = closeStmt.get({
        date_closed: data.date_closed,
        close_reason: data.close_reason,
        cost_to_close: costToClose,
        stock_delta_applied: stockDelta,
        id: optionId,
        userId,
      }) as OptionRow;

      insertStmt.run({
        userId,
        account_id: existing.account_id,
        ticker: existing.ticker.toUpperCase(),
        direction: existing.direction,
        option_type: existing.option_type,
        strike_price: data.new_strike_price!,
        expiration_date: data.new_expiration_date!,
        quantity: existing.quantity,
        premium: data.new_premium!,
        date_opened: data.date_closed,
        rolled_from_option_id: optionId,
        roll_net_premium: rollNetPremium,
        notes: existing.notes ?? null,
      });

      return row;
    })();
  } else {
    updated = closeStmt.get({
      date_closed: data.date_closed,
      close_reason: data.close_reason,
      cost_to_close: costToClose,
      stock_delta_applied: stockDelta,
      id: optionId,
      userId,
    }) as OptionRow;
  }

  const account = db
    .prepare("SELECT name FROM accounts WHERE id = ?")
    .get(updated.account_id) as { name: string };

  const priceData = await getPrices([updated.ticker.toUpperCase()]);
  return attachCalculations(
    { ...updated, account_name: account.name },
    priceData
  );
}

const MAX_CHAIN_DEPTH = 100;

export async function getRollChain(
  userId: number,
  optionId: number
): Promise<OptionWithCalculations[] | undefined> {
  // Verify the option belongs to this user
  const seed = db
    .prepare("SELECT id FROM options WHERE id = ? AND user_id = ?")
    .get(optionId, userId) as { id: number } | undefined;
  if (!seed) return undefined;

  // Walk backward to find the root of the chain
  let rootId = optionId;
  let backSteps = 0;
  while (true) {
    if (++backSteps > MAX_CHAIN_DEPTH) {
      console.error(
        `getRollChain: cycle or depth limit reached walking backward from optionId=${optionId} userId=${userId} at id=${rootId}`
      );
      throw new Error("Roll chain depth limit exceeded");
    }
    const prev = db
      .prepare(
        "SELECT rolled_from_option_id FROM options WHERE id = ? AND user_id = ?"
      )
      .get(rootId, userId) as
      | { rolled_from_option_id: number | null }
      | undefined;
    if (!prev || prev.rolled_from_option_id === null) break;
    rootId = prev.rolled_from_option_id;
  }

  // Fetch the full forward chain in one recursive CTE query, capped at MAX_CHAIN_DEPTH
  const chain = db
    .prepare(
      `WITH RECURSIVE roll_chain AS (
         SELECT o.*, a.name AS account_name, 1 AS chain_order
         FROM options o
         JOIN accounts a ON a.id = o.account_id
         WHERE o.id = @rootId AND o.user_id = @userId
         UNION ALL
         SELECT o.*, a.name AS account_name, rc.chain_order + 1
         FROM options o
         JOIN accounts a ON a.id = o.account_id
         JOIN roll_chain rc ON o.rolled_from_option_id = rc.id
         WHERE o.user_id = @userId AND rc.chain_order < @maxDepth
       )
       SELECT * FROM roll_chain ORDER BY chain_order`
    )
    .all({ rootId, userId, maxDepth: MAX_CHAIN_DEPTH }) as (OptionRow & {
    account_name: string;
  })[];

  if (chain.length >= MAX_CHAIN_DEPTH) {
    console.error(
      `getRollChain: depth limit reached walking forward from rootId=${rootId} userId=${userId}`
    );
    throw new Error("Roll chain depth limit exceeded");
  }

  const tickers = [...new Set(chain.map((r) => r.ticker.toUpperCase()))];
  const priceData = tickers.length > 0 ? await getPrices(tickers) : {};
  return chain.map((row) => attachCalculations(row, priceData));
}

export function deleteOption(userId: number, optionId: number): boolean {
  const result = db
    .prepare("DELETE FROM options WHERE id = ? AND user_id = ?")
    .run(optionId, userId);
  return result.changes > 0;
}

export function toggleIgnoreNextSteps(
  userId: number,
  optionId: number,
  ignore: boolean
): boolean {
  const result = db
    .prepare(
      `UPDATE options SET ignore_next_steps = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    )
    .run(ignore ? 1 : 0, optionId, userId);
  return result.changes > 0;
}
