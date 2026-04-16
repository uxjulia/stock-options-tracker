# Option Tracker — Client

React + TypeScript SPA for tracking options trades with a wheel-strategy focus. Runs on port 5173 and proxies `/api` requests to the server on port 3001.

## Setup

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Structure

```
src/
  api/          # One file per domain; all use apiClient from api/client.ts
  components/
    ui/         # Primitive components (Button, Badge, Input, Modal, Select, etc.)
    layout/     # App shell, nav, sidebar
    options/    # Options table, card view, forms, roll chain modal
  hooks/        # React Query hooks wrapping the api/ layer
  pages/        # Route-level components
  store/        # Zustand stores: authStore, optionStore, uiStore
  types/        # TypeScript interfaces shared across the client
  utils/        # calculations.ts, formatters.ts, cn.ts (Tailwind class merge)
```

## Key Features

- **Options table**: desktop table / mobile card view with inline actions (edit, close, delete)
- **Close option form**: handles expired, assigned, closed early, and rolled close reasons
- **Roll chain modal**: view full roll history for any option in a chain, with per-leg P&L and chain summary
- **P&L dashboard**: summary, by-account, and by-ticker breakdowns with year filter
- **Next Steps**: wheel-strategy recommendations based on net share position from assignments
- **Expiry alerts**: options expiring within 7 days (warning) or 3 days (danger) are highlighted
- **PWA**: installable, with NetworkFirst API caching via vite-plugin-pwa

## Authentication

On app load, `AuthGate` in `App.tsx` calls `POST /api/auth/refresh` to silently hydrate the access token from the httpOnly cookie. The Axios interceptor in `api/client.ts` auto-refreshes on 401 and queues any concurrent failed requests.

## Data Fetching

All server state uses React Query (TanStack Query v5). Mutations invalidate relevant query keys (`options`, `pnl`, `next-steps`) on success. Client-only state (auth, UI) lives in Zustand.

## Close Reasons

| Value | Description |
|---|---|
| `expired` | Option expired worthless |
| `assigned` | Option was exercised; shares assigned |
| `closed_early` | Bought back / sold before expiration |
| `rolled` | Closed and simultaneously opened a new position at a different strike or expiry |

When closing as `rolled`, the form collects cost-to-close, new strike price, new expiration date, and new premium. A new open option record is auto-created inheriting ticker, account, direction, type, and quantity from the original.
