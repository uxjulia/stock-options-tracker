import fs from "fs";
import path from "path";
import db from "../config/database";

// Rebuilds the options table to add rolled_from_option_id and roll_net_premium
// and update the close_reason CHECK constraint to include 'rolled'.
// Safe to call on any DB: no-ops if columns already exist.
function migrateOptionsForRolled(): void {
  const cols = db.pragma("table_info(options)") as Array<{ name: string }>;
  const hasRolledCols = cols.some((c) => c.name === "rolled_from_option_id");
  const tableDef = (
    db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='options'")
      .get() as { sql: string } | undefined
  )?.sql ?? "";
  const hasRolledConstraint = tableDef.includes("'rolled'");
  if (hasRolledCols && hasRolledConstraint) return;

  db.pragma("foreign_keys = OFF");
  try {
    db.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE options_new (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id            INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        ticker                TEXT    NOT NULL,
        direction             TEXT    NOT NULL CHECK(direction IN ('bought', 'sold')),
        option_type           TEXT    NOT NULL CHECK(option_type IN ('call', 'put')),
        strike_price          REAL    NOT NULL,
        expiration_date       TEXT    NOT NULL,
        quantity              INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
        premium               REAL    NOT NULL,
        date_opened           TEXT    NOT NULL,
        date_closed           TEXT,
        close_reason          TEXT    CHECK(close_reason IN ('assigned', 'expired', 'closed_early', 'rolled')),
        cost_to_close         REAL,
        stock_delta_applied   INTEGER,
        rolled_from_option_id INTEGER REFERENCES options_new(id) ON DELETE SET NULL,
        roll_net_premium      REAL,
        ignore_next_steps     INTEGER NOT NULL DEFAULT 0,
        notes                 TEXT,
        created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO options_new (
        id, user_id, account_id, ticker, direction, option_type,
        strike_price, expiration_date, quantity, premium, date_opened,
        date_closed, close_reason, cost_to_close, stock_delta_applied,
        rolled_from_option_id, roll_net_premium,
        ignore_next_steps, notes, created_at, updated_at
      )
      SELECT
        id, user_id, account_id, ticker, direction, option_type,
        strike_price, expiration_date, quantity, premium, date_opened,
        date_closed, close_reason, cost_to_close, stock_delta_applied,
        NULL, NULL,
        ignore_next_steps, notes, created_at, updated_at
      FROM options;

      DROP TABLE options;
      ALTER TABLE options_new RENAME TO options;

      CREATE INDEX IF NOT EXISTS idx_options_user_id     ON options(user_id);
      CREATE INDEX IF NOT EXISTS idx_options_account_id  ON options(account_id);
      CREATE INDEX IF NOT EXISTS idx_options_ticker      ON options(ticker);
      CREATE INDEX IF NOT EXISTS idx_options_expiration  ON options(expiration_date);
      CREATE INDEX IF NOT EXISTS idx_options_date_opened ON options(date_opened);
      CREATE INDEX IF NOT EXISTS idx_options_date_closed ON options(date_closed);
      CREATE INDEX IF NOT EXISTS idx_options_rolled_from ON options(rolled_from_option_id);

      COMMIT;
    `);
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch (_) {
      // ignore — transaction may not have started
    }
    console.error(
      "Options table migration failed (options → options_new via db.exec):",
      err
    );
    throw err;
  } finally {
    db.pragma("foreign_keys = ON");
  }

  console.log("✅ Options table rebuilt for rolled option support");
}

export function runMigrations(): void {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons, strip comment-only lines from each chunk,
  // then skip chunks that have no actual SQL left
  const statements = schema
    .split(";")
    .map((chunk) => {
      // Remove comment lines but keep the actual SQL lines
      const lines = chunk
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("--"));
      return lines.join("\n").trim();
    })
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      db.exec(statement + ";");
    } catch (err) {
      const upper = statement.toUpperCase().trimStart();
      // Ignore errors on PRAGMA statements which may already be set
      if (upper.startsWith("PRAGMA")) continue;
      // Ignore duplicate column errors from ALTER TABLE ADD COLUMN (idempotent re-runs)
      if (
        upper.startsWith("ALTER TABLE") &&
        upper.includes("ADD COLUMN") &&
        err instanceof Error &&
        err.message.includes("duplicate column name")
      ) {
        continue;
      }
      throw err;
    }
  }

  migrateOptionsForRolled();

  console.log("✅ Database migrations complete");
}
