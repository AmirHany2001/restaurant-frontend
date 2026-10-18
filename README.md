# Restaurant frontend

The web client of the restaurant system: a public menu, a cart, ordering for customers, and an
admin area to manage products, categories, orders and users. Arabic (right-to-left) and English.

It talks to the Spring Boot REST API in the sibling **`site`** project (the backend).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query · i18next

## Run it

You need Node.js 20+ and the backend running (default `http://localhost:8080`).

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server **must** use port `5173` (`vite.config.ts` has `strictPort`): in the dev profile the
backend only accepts browser requests (CORS) from `http://localhost:5173` and `http://localhost:3000`.

| Script | What it does |
|---|---|
| `npm run dev` | dev server with hot reload |
| `npm run build` | type-check (`tsc`) and build to `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | serve the built `dist/` |

### Configuration

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | where the backend runs |

Copy `.env.example` to `.env` to change it. **Everything named `VITE_*` is bundled into the
JavaScript that every visitor downloads. Never put a secret in it.**

## What it does

- **Menu** (public): categories and items with a price per size. Unavailable items are greyed out.
- **Cart**: kept in `localStorage`, survives a refresh. The totals shown are an estimate: the
  server prices the order from the database.
- **Checkout** needs a login; after logging in you return to the cart.
- **My orders**: paginated, newest first, cancel while an order is still pending.
- **Admin** (`/admin`, role `ADMIN` only): products (add, change prices, availability, delete),
  categories, orders (move them through their statuses, filter by status) and users (roles, delete).
  An admin has no cart and no "my orders".
- **Language**: English / Arabic switch in the header. The whole layout flips for Arabic and the
  choice is remembered. The backend answers in the same language (`Accept-Language`).

## Project layout

```
src/
  api/          client.ts (one place that talks to the backend), endpoints.ts, types.ts
  auth/         login state, token storage, useAuth hook
  cart/         cart state (localStorage)
  components/   Layout, LanguageSwitcher, RequireAuth, CustomerOnly, OrderCard, Pagination, ...
  i18n/         en.ts, ar.ts (ar.ts is typed against en.ts: a missing key does not compile)
  pages/        customer pages; pages/admin/ for the admin area
  utils/        prices parsing/validation
```

## How sessions work (and their limits)

- After login the token and the user are stored in `localStorage` (key `auth`). A refresh keeps you
  logged in; **Log out** removes them and clears everything fetched for that user.
- If the backend answers `401` to a request that carried a token (it expired), the app logs out
  automatically.
- Hiding a page in the UI (e.g. `/admin`) is only for convenience. **The backend enforces every
  permission**; the UI is never the security boundary.
- A token in `localStorage` can be read by any script running on the page (XSS). Keep dependencies
  updated and never render untrusted HTML.

## Not done yet

- Refresh tokens: when the token expires the user must log in again (no "session expired" message yet).
- Frontend tests.
- Payments.
