# NEPA Unite — Frontend

Enterprise-grade frontend for **NEPA Unite**, a regional B2B marketplace. Built as
a headless client for the Django/DRF backend (`../backend`), with four role-based
portals (Buyer, Seller, Admin, Auditor) plus a public marketing site.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 + CSS-variable design tokens |
| UI primitives | Radix UI + shadcn-style components (hand-authored) |
| Data fetching | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide |
| HTTP | Axios (interceptors for auth + error normalization) |
| Auth | NextAuth (Credentials → backend JWT, refresh-aware) |
| Theme | next-themes (light/dark) |
| Toasts | Sonner |

## Getting started

```bash
cd frontend
npm install --legacy-peer-deps     # React 19 peer ranges
cp .env.example .env.local         # then edit values
npm run dev                        # http://localhost:3000
```

Requires the backend running at `http://localhost:8000` (configurable via
`NEXT_PUBLIC_API_BASE_URL`). See `../backend/FRONTEND_API.md` for the API contract.

### Environment

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | JSON API base, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_API_ROOT_URL` | Root API (health/docs), e.g. `http://localhost:8000/api` |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | NextAuth config |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional; also fetched from `/payments/config` |

## Architecture

```
src/
├── app/                 # App Router
│   ├── (public)/        # marketing site (landing, features, pricing, faq…)
│   ├── (auth)/          # login, register, forgot/reset password
│   ├── buyer/           # Buyer portal (DashboardShell)
│   ├── seller/          # Seller portal
│   ├── admin/           # Admin portal
│   ├── auditor/         # Auditor portal (read-only)
│   ├── api/auth/[...nextauth]/  # NextAuth route handler
│   ├── layout.tsx       # root: fonts, providers
│   ├── error.tsx · not-found.tsx
│   └── globals.css      # design tokens (light/dark)
├── components/
│   ├── ui/              # primitives (button, card, dialog, table, …)
│   ├── shared/          # composites (DataTable, KpiCard, EmptyState, …)
│   ├── charts/          # Recharts wrappers + ChartCard
│   └── marketing/       # public-site interactive bits
├── features/            # domain hooks (cart, orders, products, …)
├── services/            # API service layer (1:1 with backend endpoints)
├── hooks/               # useAuth, useDebounce, useMediaQuery, useMounted
├── stores/              # Zustand (ui, cart, notifications)
├── lib/                 # axios, auth, utils, constants, validations, navigation
├── types/               # domain types + next-auth augmentation
├── providers/           # Session, Query, Theme, Toaster, TokenSync
├── layouts/             # DashboardShell, Sidebar, Topbar, CommandPalette…
└── middleware.ts        # route protection + role gating
```

### Design system

Tokens live in `src/app/globals.css` as HSL CSS variables and are surfaced through
Tailwind (`tailwind.config.ts`). Brand palette:

- **Primary** `#0F172A` (slate) · **Brand** `#2563EB` · **Accent/Teal** `#14B8A6`
- Success `#22C55E` · Warning `#F59E0B` · Danger `#EF4444` · Background `#F8FAFC`

Light/dark themes swap the same token names. Fluid typography via `text-fluid-*`
clamp utilities. Use semantic classes (`bg-card`, `text-brand`, `bg-success/10`) —
never raw hex.

### State management

- **Server state** → TanStack Query, keyed via `src/lib/query-keys.ts`. Mutations
  invalidate/patch the cache and toast.
- **Client/UI state** → Zustand (`ui-store` sidebar/command/notifications,
  `cart-store` header badge, `notification-store` notification center).

### Auth flow

`NextAuth` Credentials provider calls `POST /auth/login`, decodes the backend JWT,
enriches with role/status from `/members/{id}/`, and stores tokens in the session
JWT. `TokenSync` mirrors the access token into the Axios instance; the jwt callback
refreshes via `/auth/refresh` before expiry. `middleware.ts` gates each `/buyer`,
`/seller`, `/admin`, `/auditor` prefix to its role.

### API integration

All network access goes through `src/services` (typed, trailing-slash-correct per
the backend contract) — never call `fetch`/`axios` directly in components. Prefer
the feature hooks in `src/features/*`. Errors are normalized to
`ApiError {message, status, fieldErrors}`.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # serve production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

## Conventions

See `CONVENTIONS.md` for the component/hook catalog and the rules every page
follows (client components, services-only networking, design tokens, loading/empty/
error states).
