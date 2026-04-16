# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Option Tracker v2 is a personal options trading tracker with a wheel-strategy focus. It is a monorepo with two separate Node.js projects:

- **`server/`** — Express + TypeScript REST API, SQLite via `better-sqlite3`, runs on port 3001
- **`client/`** — React + Vite + TypeScript SPA, runs on port 5173 (proxies `/api` to server)

Both have their own `package.json`, `node_modules`, and `tsconfig.json`. There is no root-level build system tying them together.

## Commands

### Server (`cd server`)
```bash
npm run dev       # tsx watch — hot reload in development
npm run build     # tsc compile to dist/
npm run start     # NODE_ENV=production node dist/index.js
npm run seed      # populate the DB with sample data
```

### Client (`cd client`)
```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # preview the production build
```

### Production (PM2)
The `ecosystem.config.js` at root runs `npm run start` in `server/` under the process name `options`. The client is served as static files from the built `client/dist/`.

### Database
Migrations run automatically on server start via `server/src/db/migrate.ts`, which executes `server/src/db/schema.sql`. No separate migration command needed. To reset, delete the SQLite file at `DB_PATH` (default `server/data/options.db`).

## Environment Setup

Copy `server/.env.example` to `server/.env` and fill in:
```
PORT=3001
JWT_SECRET=<min 16 chars>
JWT_REFRESH_SECRET=<min 16 chars>
DB_PATH=./data/options.db
NODE_ENV=development
```

## Architecture

### Authentication
- Short-lived JWT access token (15m) sent as `Authorization: Bearer` header
- Long-lived refresh token (7d) stored as httpOnly cookie
- On app load, `AuthGate` in `client/src/App.tsx` silently calls `POST /api/auth/refresh` to hydrate the access token from the cookie
- `client/src/api/client.ts` has an Axios interceptor that auto-refreshes on 401 and queues concurrent failed requests

### Server Structure
```
server/src/
  config/         # env.ts (zod-validated env), database.ts (better-sqlite3 singleton), constants.ts
  db/             # schema.sql, migrate.ts, seed.ts
  models/         # TypeScript interfaces matching DB rows
  routes/         # Express routers, one file per domain
  controllers/    # Thin — parse/validate request, call service, return response
  services/       # All business logic and DB queries (better-sqlite3 synchronous)
  middleware/     # requireAuth, errorHandler, rateLimiter, validate (zod)
  utils/          # calculations.ts (breakeven, proceeds, stock delta), yahooFinance.ts
```

All DB access uses `better-sqlite3` (synchronous). The only async operations are Yahoo Finance price fetches in `tickers.service.ts`.

### Client Structure
```
client/src/
  api/            # One file per domain, all use apiClient from api/client.ts
  store/          # Zustand stores: authStore, optionStore, uiStore
  hooks/          # React Query hooks wrapping the api/ layer
  pages/          # Route-level components
  components/     # ui/ (primitives), layout/, and domain-specific components
  types/          # TypeScript interfaces shared across the client
  utils/          # calculations.ts, formatters.ts, cn.ts (tailwind class merge)
```

Data fetching is done through React Query (TanStack Query v5). Zustand is used only for client-side state (auth, UI).

### Ticker Price Cache
Prices are fetched from Yahoo Finance and cached in the `ticker_price_cache` SQLite table with a 15-minute TTL. Manual price overrides bypass the TTL. Stale prices are returned immediately while a background refresh is triggered.

### Key Business Logic
- **Proceeds**: For sold options: `(premium - cost_to_close) * 100 * quantity`. For bought options: `(cost_to_close - premium) * 100 * quantity`.
- **Stock delta** (`stock_delta_applied`): Computed at close time for assigned options and stored on the row. Used by the Next Steps service to calculate net share position per ticker.
- **Next Steps**: Recommends wheel-strategy follow-up trades (sell covered call if net long, sell CSP if net short) based on accumulated `stock_delta_applied` across all assigned options for a ticker. Options with `ignore_next_steps = 1` are suppressed.
- **Closed options visibility**: Options closed more than 30 days ago are hidden by default (`HIDE_OLDER_THAN_DAYS = 30`).
- **Expiry warnings**: Dashboard flags options expiring within 7 days (warning) or 3 days (danger).
- **Rolled options**: Closing with reason `'rolled'` simultaneously creates a new open option inheriting ticker/account/direction/option_type/quantity. The new option stores `rolled_from_option_id` (FK to the closed option) and `roll_net_premium` (new_premium − cost_to_close). This forms a singly-linked chain: backward traversal (newest → root) follows `rolled_from_option_id` directly; forward traversal (root → newest) requires reverse FK queries (`WHERE rolled_from_option_id = current.id`), as implemented in `getRollChain` via a recursive CTE.

### Close Reasons
| Value | Notes |
|-------|-------|
| `expired` | Option expired worthless |
| `assigned` | Shares assigned; triggers `stock_delta_applied` calculation |
| `closed_early` | Bought back / sold before expiry; requires `cost_to_close` |
| `rolled` | Closed and re-opened at new strike/expiry; requires `cost_to_close`, `new_strike_price`, `new_expiration_date`, `new_premium`; auto-creates new option |

### API Routes
All routes are under `/api`:
- `/auth` — login, logout, refresh
- `/accounts` — CRUD for brokerage accounts
- `/options` — CRUD + close + toggle ignore_next_steps; list supports filters (account, ticker, type, direction, status, pagination)
  - `POST /:id/close` — accepts `close_reason`, `date_closed`, optional `cost_to_close`; for `rolled` also accepts `new_strike_price`, `new_expiration_date`, `new_premium`
  - `GET /:id/roll-chain` — returns ordered array of all options in the roll chain (root → current open leg)
- `/tickers` — get prices, set/clear manual override
- `/pnl` — summary, by-account, by-ticker (filterable by year/account)
- `/next-steps` — wheel strategy recommendations

### PWA
The client is configured as a PWA via `vite-plugin-pwa`. API responses are cached with NetworkFirst strategy (5-minute max age, 50 entries). Service worker auto-updates on new builds.
