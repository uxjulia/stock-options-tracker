import db from '../config/database';
import type { Account, AccountWithStats } from '../models/account.model';

export function listAccounts(userId: number): AccountWithStats[] {
  return db
    .prepare(
      `SELECT
        a.*,
        COUNT(DISTINCT o.id) AS trade_count,
        SUM(CASE WHEN o.date_closed IS NULL THEN 1 ELSE 0 END) AS open_count,
        COALESCE(
          SUM(CASE
            WHEN o.date_closed IS NOT NULL AND o.direction = 'sold'
              THEN (o.premium - COALESCE(o.cost_to_close, 0)) * 100 * o.quantity
            WHEN o.date_closed IS NOT NULL AND o.direction = 'bought'
              THEN -(o.premium * 100 * o.quantity) +
                   CASE WHEN o.close_reason = 'closed_early'
                     THEN COALESCE(o.cost_to_close, 0) * 100 * o.quantity
                     ELSE 0 END
            ELSE 0
          END), 0
        ) AS realized_pnl
      FROM accounts a
      LEFT JOIN options o ON o.account_id = a.id AND o.user_id = a.user_id
      WHERE a.user_id = ?
      GROUP BY a.id
      ORDER BY a.name ASC`
    )
    .all(userId) as AccountWithStats[];
}

export function getAccount(userId: number, accountId: number): Account | undefined {
  return db
    .prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?')
    .get(accountId, userId) as Account | undefined;
}

export function createAccount(userId: number, data: { name: string; description?: string }): Account {
  const result = db
    .prepare(
      'INSERT INTO accounts (user_id, name, description) VALUES (?, ?, ?) RETURNING *'
    )
    .get(userId, data.name, data.description ?? null) as Account;
  return result;
}

export function updateAccount(
  userId: number,
  accountId: number,
  data: { name?: string; description?: string; is_active?: boolean }
): Account | undefined {
  const existing = getAccount(userId, accountId);
  if (!existing) return undefined;

  const name = data.name ?? existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active;

  return db
    .prepare(
      `UPDATE accounts
       SET name = ?, description = ?, is_active = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?
       RETURNING *`
    )
    .get(name, description, is_active, accountId, userId) as Account;
}

export function deleteAccount(userId: number, accountId: number): boolean {
  // Check if account has options
  const hasOptions = db
    .prepare('SELECT COUNT(*) as count FROM options WHERE account_id = ? AND user_id = ?')
    .get(accountId, userId) as { count: number };

  if (hasOptions.count > 0) {
    // Soft-delete: mark inactive
    db.prepare(
      `UPDATE accounts SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`
    ).run(accountId, userId);
    return true;
  }

  const result = db
    .prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?')
    .run(accountId, userId);
  return result.changes > 0;
}
