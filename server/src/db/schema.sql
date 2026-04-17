PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACCOUNTS (brokerage accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============================================================
-- OPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS options (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id          INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,

  ticker              TEXT    NOT NULL,
  direction           TEXT    NOT NULL CHECK(direction IN ('bought', 'sold')),
  option_type         TEXT    NOT NULL CHECK(option_type IN ('call', 'put')),
  strike_price        REAL    NOT NULL,
  expiration_date     TEXT    NOT NULL,   -- ISO date: "2026-03-21"
  quantity            INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  premium             REAL    NOT NULL,   -- per share, always stored positive

  date_opened         TEXT    NOT NULL,   -- ISO date

  -- Close tracking (null until closed)
  date_closed         TEXT,
  close_reason        TEXT    CHECK(close_reason IN ('assigned', 'expired', 'closed_early', 'rolled')),
  cost_to_close       REAL,              -- per share, only when close_reason = 'closed_early' or 'rolled'
  stock_delta_applied INTEGER,           -- computed and stored at close time for 'assigned' options

  -- Roll tracking (null unless this option was opened as part of a roll)
  rolled_from_option_id INTEGER REFERENCES options(id) ON DELETE SET NULL,
  roll_net_premium      REAL,            -- new_premium - cost_to_close at roll time

  -- Wheel strategy: suppress next-steps recommendation for this ticker's option
  ignore_next_steps   INTEGER NOT NULL DEFAULT 0,

  notes               TEXT,

  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Add roll-tracking columns to existing options tables (idempotent)
ALTER TABLE options ADD COLUMN rolled_from_option_id INTEGER REFERENCES options(id) ON DELETE SET NULL;
ALTER TABLE options ADD COLUMN roll_net_premium REAL;

CREATE INDEX IF NOT EXISTS idx_options_user_id       ON options(user_id);
CREATE INDEX IF NOT EXISTS idx_options_account_id    ON options(account_id);
CREATE INDEX IF NOT EXISTS idx_options_ticker        ON options(ticker);
CREATE INDEX IF NOT EXISTS idx_options_expiration    ON options(expiration_date);
CREATE INDEX IF NOT EXISTS idx_options_date_opened   ON options(date_opened);
CREATE INDEX IF NOT EXISTS idx_options_date_closed   ON options(date_closed);
CREATE INDEX IF NOT EXISTS idx_options_rolled_from   ON options(rolled_from_option_id);

-- ============================================================
-- TICKER SETTINGS (per-user, per-ticker preferences)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticker_settings (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker              TEXT    NOT NULL,
  acknowledged_delta  INTEGER NOT NULL DEFAULT 0,  -- hold target (shares user wants to keep)
  delta_basis         INTEGER NOT NULL DEFAULT 0,  -- raw sum offset at last "Reset Delta"
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_ticker_settings_user_id ON ticker_settings(user_id);

-- Add delta_basis column to existing ticker_settings tables (idempotent)
ALTER TABLE ticker_settings ADD COLUMN delta_basis INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- TICKER PRICE CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS ticker_price_cache (
  symbol             TEXT    NOT NULL UNIQUE,
  price              REAL    NOT NULL,
  is_manual_override INTEGER NOT NULL DEFAULT 0,
  fetched_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ticker_cache_symbol ON ticker_price_cache(symbol);
