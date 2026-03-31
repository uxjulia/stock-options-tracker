import db from "../config/database";

export interface PnLByAccount {
  account_id: number;
  account_name: string;
  trade_count: number;
  win_count: number;
  realized_pnl: number;
}

export interface PnLByTicker {
  ticker: string;
  trade_count: number;
  win_count: number;
  realized_pnl: number;
  net_stock_delta: number;
  hold_target: number;
  effective_delta: number;
}

export interface MonthlyPnL {
  month: string; // "YYYY-MM"
  realized_pnl: number;
}

export interface PnLSummary {
  total_realized: number;
  total_trades: number;
  win_rate: number;
  by_month: MonthlyPnL[];
}

function proceeds(
  direction: string,
  premium: number,
  qty: number,
  closeReason: string | null,
  costToClose: number | null
): number {
  if (direction === "sold") {
    const credit = premium * 100 * qty;
    const closeCost =
      closeReason === "closed_early" ? (costToClose ?? 0) * 100 * qty : 0;
    return credit - closeCost;
  } else {
    const debit = premium * 100 * qty;
    const sellBack =
      closeReason === "closed_early" ? (costToClose ?? 0) * 100 * qty : 0;
    return sellBack - debit;
  }
}

export function getPnLByAccount(userId: number, year?: number): PnLByAccount[] {
  const yearFilter = year
    ? `AND strftime('%Y', o.date_closed) = '${year}'`
    : "";

  return db
    .prepare(
      `SELECT
        a.id AS account_id,
        a.name AS account_name,
        COUNT(o.id) AS trade_count,
        SUM(CASE
          WHEN o.direction = 'sold' AND (o.premium - COALESCE(o.cost_to_close, 0)) > 0 THEN 1
          WHEN o.direction = 'bought' AND (COALESCE(o.cost_to_close, 0) - o.premium) > 0 THEN 1
          ELSE 0
        END) AS win_count,
        COALESCE(SUM(
          CASE
            WHEN o.direction = 'sold'
              THEN (o.premium - COALESCE(o.cost_to_close, 0)) * 100 * o.quantity
            WHEN o.direction = 'bought'
              THEN (COALESCE(o.cost_to_close, 0) - o.premium) * 100 * o.quantity
            ELSE 0
          END
        ), 0) AS realized_pnl
      FROM accounts a
      LEFT JOIN options o ON o.account_id = a.id
        AND o.user_id = a.user_id
        AND o.date_closed IS NOT NULL
        ${yearFilter}
      WHERE a.user_id = ?
      GROUP BY a.id, a.name
      ORDER BY realized_pnl DESC`
    )
    .all(userId) as PnLByAccount[];
}

export function getPnLByTicker(
  userId: number,
  accountId?: number,
  year?: number
): PnLByTicker[] {
  const conditions = [`o.user_id = ? AND o.date_closed IS NOT NULL`];
  const params: unknown[] = [userId];

  if (accountId) {
    conditions.push(`o.account_id = ?`);
    params.push(accountId);
  }
  if (year) {
    conditions.push(`strftime('%Y', o.date_closed) = ?`);
    params.push(String(year));
  }

  const pnlRows = db
    .prepare(
      `SELECT
        o.ticker,
        COUNT(o.id) AS trade_count,
        SUM(CASE
          WHEN o.direction = 'sold' AND (o.premium - COALESCE(o.cost_to_close, 0)) > 0 THEN 1
          WHEN o.direction = 'bought' AND (COALESCE(o.cost_to_close, 0) - o.premium) > 0 THEN 1
          ELSE 0
        END) AS win_count,
        COALESCE(SUM(
          CASE
            WHEN o.direction = 'sold'
              THEN (o.premium - COALESCE(o.cost_to_close, 0)) * 100 * o.quantity
            WHEN o.direction = 'bought'
              THEN (COALESCE(o.cost_to_close, 0) - o.premium) * 100 * o.quantity
            ELSE 0
          END
        ), 0) AS realized_pnl
      FROM options o
      WHERE ${conditions.join(" AND ")}
      GROUP BY o.ticker
      ORDER BY realized_pnl DESC`
    )
    .all(...params) as Omit<PnLByTicker, "net_stock_delta" | "hold_target" | "effective_delta">[];

  // Delta info is lifetime (not filtered by year/account)
  const deltaRows = db
    .prepare(
      `SELECT
        o.ticker,
        SUM(o.stock_delta_applied) - COALESCE(ts.delta_basis, 0) AS net_stock_delta,
        COALESCE(ts.acknowledged_delta, 0) AS hold_target
       FROM options o
       LEFT JOIN ticker_settings ts ON ts.ticker = o.ticker AND ts.user_id = o.user_id
       WHERE o.user_id = ? AND o.close_reason = 'assigned'
       GROUP BY o.ticker`
    )
    .all(userId) as { ticker: string; net_stock_delta: number; hold_target: number }[];

  const deltaMap = new Map(deltaRows.map((r) => [r.ticker, r]));

  return pnlRows.map((row) => {
    const delta = deltaMap.get(row.ticker);
    const netStockDelta = delta?.net_stock_delta ?? 0;
    const holdTarget = delta?.hold_target ?? 0;
    return {
      ...row,
      net_stock_delta: netStockDelta,
      hold_target: holdTarget,
      effective_delta: netStockDelta - holdTarget,
    };
  });
}

export function getPnLSummary(userId: number): PnLSummary {
  const totalRow = db
    .prepare(
      `SELECT
        COUNT(*) AS total_trades,
        COALESCE(SUM(
          CASE
            WHEN direction = 'sold'
              THEN (premium - COALESCE(cost_to_close, 0)) * 100 * quantity
            WHEN direction = 'bought'
              THEN (COALESCE(cost_to_close, 0) - premium) * 100 * quantity
            ELSE 0
          END
        ), 0) AS total_realized,
        SUM(CASE
          WHEN direction = 'sold' AND (premium - COALESCE(cost_to_close, 0)) > 0 THEN 1
          WHEN direction = 'bought' AND (COALESCE(cost_to_close, 0) - premium) > 0 THEN 1
          ELSE 0
        END) AS win_count
      FROM options
      WHERE user_id = ? AND date_closed IS NOT NULL`
    )
    .get(userId) as {
    total_trades: number;
    total_realized: number;
    win_count: number;
  };

  const byMonth = db
    .prepare(
      `SELECT
        strftime('%Y-%m', date_closed) AS month,
        COALESCE(SUM(
          CASE
            WHEN direction = 'sold'
              THEN (premium - COALESCE(cost_to_close, 0)) * 100 * quantity
            WHEN direction = 'bought'
              THEN (COALESCE(cost_to_close, 0) - premium) * 100 * quantity
            ELSE 0
          END
        ), 0) AS realized_pnl
      FROM options
      WHERE user_id = ? AND date_closed IS NOT NULL
      GROUP BY strftime('%Y-%m', date_closed)
      ORDER BY month ASC`
    )
    .all(userId) as MonthlyPnL[];

  const winRate =
    totalRow.total_trades > 0
      ? Math.round((totalRow.win_count / totalRow.total_trades) * 100)
      : 0;

  return {
    total_realized: totalRow.total_realized,
    total_trades: totalRow.total_trades,
    win_rate: winRate,
    by_month: byMonth,
  };
}
