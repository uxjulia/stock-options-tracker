# Stock Options Tracker

A self-hosted personal options trading tracker with a React frontend and Express/SQLite backend.

---

## Features

- **Dashboard** — portfolio overview with current positions and P&L summary
- **Options** — log and manage options trades (calls & puts)
- **P&L** — detailed profit & loss breakdown across positions
- **Next Steps** — personal action items and trade notes
- **Accounts** — manage brokerage accounts
- **Live Prices** — automatic price fetching via a three-provider fallback chain:
  1. **Finnhub** (primary — real-time, 60 req/min free tier)
  2. **Yahoo Finance** (backup — scraped, no key required)
  3. **Polygon.io** (last resort — previous-day close, free tier)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, `tsx` |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Monorepo | npm workspaces |

---

## Project Structure

```
option-tracker-v2/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── api/     # API client functions
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── store/
├── server/          # Express backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── db/      # Migrations & seed
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
└── data/            # SQLite database file (gitignored)
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp server/.env.example server/.env
```

Or create `server/.env` manually:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/options.db
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>

# Price providers (all optional — any combination works)
FINNHUB_API_KEY=your_key_here     # https://finnhub.io  (free, 60 req/min)
POLYGON_API_KEY=your_key_here     # https://polygon.io  (free tier = prev-day close)
```

### 3. Seed the database

Creates the `admin` user with the default password `changeme123`:

```bash
npm run seed --workspace=server
```

To set a custom password:

```bash
npm run seed --workspace=server -- mypassword
```

> ⚠️ Change your password after first login via the ⚙️ settings icon in the sidebar.

### 4. Run in development

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001/api](http://localhost:3001/api)

---

## Production Build

```bash
npm run build
npm start
```

In production, the server serves the built React client at `/` and the API at `/api`.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user |
| `PUT` | `/api/auth/password` | Change password |
| `GET` | `/api/options` | List options |
| `POST` | `/api/options` | Create option |
| `PUT` | `/api/options/:id` | Update option |
| `DELETE` | `/api/options/:id` | Delete option |
| `GET` | `/api/accounts` | List accounts |
| `POST` | `/api/accounts` | Create account |
| `GET` | `/api/pnl` | P&L summary |
| `GET` | `/api/tickers/prices` | Fetch live prices |
| `GET` | `/api/next-steps` | List next steps |

All endpoints except login require a valid JWT (`Authorization: Bearer <token>` or session cookie).
