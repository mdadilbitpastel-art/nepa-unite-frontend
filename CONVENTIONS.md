# NEPA Unite Frontend — Build Conventions (READ FIRST)

The **foundation is already built and type-checks clean**. When adding pages,
REUSE the existing primitives — do NOT re-create components, re-define types, or
call `axios`/`fetch` directly. Follow these patterns exactly.

## Golden rules
1. Every page that uses hooks/state is a **Client Component**: start the file with `"use client";`.
2. **Never** hardcode API URLs or call fetch/axios. Use the **service layer** (`@/services`) or, preferably, the **feature hooks** (`@/features/...`). Trailing slashes are already handled there.
3. Money is a **decimal string** — render with `formatCurrency(value)`. Dates with `formatDate` / `formatDateTime` / `timeAgo`. All from `@/lib/utils`.
4. IDs are UUID strings. Backend **list endpoints return plain arrays** (no pagination wrapper) — derive client-side stats/pagination. Only `productService.search` is paginated (`{count,page,page_size,results}`).
5. Use the design tokens — `bg-card`, `text-muted-foreground`, `text-brand`, `bg-brand`, `text-teal`, `bg-success/10`, etc. Brand = `#2563EB` (`brand`), accent = `#14B8A6` (`teal`), primary = slate-900. Never raw hex.
6. Add subtle **Framer Motion** entrance on hero/stat sections (see `KpiCard`). Keep it tasteful.
7. Keep views thin and polished: loading skeletons, empty states, error handling everywhere.

## Available UI primitives — `@/components/ui/*`
`button` (variants: default, brand, teal, destructive, success, outline, secondary, ghost, link; sizes: sm, default, lg, xl, icon; props `loading`, `asChild`), `card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter), `badge` (variants: default, info, success, warning, danger, muted, outline, teal; prop `dot`), `input`, `textarea`, `label`, `select` (Select, SelectTrigger, SelectValue, SelectContent, SelectItem), `dialog`, `sheet`, `dropdown-menu`, `tabs`, `tooltip`, `popover`, `progress`, `switch`, `checkbox`, `scroll-area`, `skeleton`, `table` (Table, TableHeader, TableBody, TableRow, TableHead, TableCell), `command`, `avatar` (Avatar, AvatarImage, AvatarFallback).

## Shared composite components — `@/components/shared/*`
- `PageHeader` `{title, description?, actions?}` — top of every page.
- `KpiCard` `{label, value, icon?, delta?, deltaLabel?, accent?, hint?, index?}` — dashboard metric tiles. `accent`: brand|teal|success|warning|danger|primary.
- `DataTable` — TanStack table `{columns, data, loading?, searchable?, onRowClick?, enableRowSelection?, onSelectionChange?, toolbar?, emptyTitle?, emptyDescription?}`. Columns are `ColumnDef<T>[]` from `@tanstack/react-table`.
- `Pagination` `{page, pageSize, total, onPageChange}`.
- `EmptyState` `{icon?, title, description?, action?}`.
- `states.tsx`: `Spinner`, `PageLoader`, `ErrorState`, `KpiSkeletonGrid`, `TableSkeleton`, `CardGridSkeleton`.
- `status-badge.tsx`: `OrderStatusBadge`, `PaymentStatusBadge`, `CommissionStatusBadge`, `AccountStatusBadge` — pass `{status}`.
- `OrderTimeline` `{status}` — vertical lifecycle stepper.
- `ConfirmDialog` `{open, onOpenChange, title, description?, confirmLabel?, destructive?, loading?, onConfirm}`.
- `Field` + `PasswordInput` from `form-field.tsx` for RHF forms.
- `ErrorBoundary` (already wraps page content in the shell).

## Charts — `@/components/charts/*`
- `ChartCard` `{title, description?, action?, children}`.
- `AreaTrendChart` / `BarSeriesChart` / `LineSeriesChart` `{data, xKey, series:[{key,label,color?}], height?}`.
- `DonutChart` `{data:[{name,value,color?}], height?}`.
Colors: use `hsl(var(--brand))`, `hsl(var(--teal))`, `hsl(var(--success))`, `hsl(var(--warning))` or omit for auto palette.

## Feature hooks (preferred) — `@/features/*`
- Cart: `useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart`, `useCheckout`.
- Orders: `useOrders(params?)`, `useOrder(id)`, `useUpdateOrderStatus`, `useInvoice(orderId, enabled?)`.
- Products: `useProducts`, `useProduct(id)`, `useProductSearch(params)`, `useCategories`, `useProductsBySeller`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`.
- Wishlist: `useWishlist`, `useAddToWishlist`, `useRemoveFromWishlist`.
For domains without hooks yet (members, addresses, payments, commissions), either add a small hook file in the same style OR call the service directly inside `useQuery`/`useMutation`. Use `@/lib/query-keys` (`qk`) for keys.

## Services — `@/services`
`authService, memberService, addressService, productService, wishlistService, cartService, orderService, paymentService, commissionService, jobService, systemService`. Each method maps to a real backend endpoint (see `backend/FRONTEND_API.md`). Errors throw `ApiError {message, status, fieldErrors}` (from `@/lib/axios`).

## Auth & roles
- `useAuth()` → `{user, role, isAuthenticated, signOut}`. `user`: `{id, email, role, status}`.
- Role gating is done by `middleware.ts`. Pages live under `/buyer`, `/seller`, `/admin`, `/auditor` and inherit `DashboardShell` (sidebar+topbar) from the route-group layout — **do not** re-add the shell in pages.
- Navigation lives in `@/lib/navigation.tsx` (`NAV_BY_ROLE`). If you add a NEW route, make sure a matching nav item exists (it usually already does).

## Toasts
`import { toast } from "sonner";` → `toast.success(...)`, `toast.error(...)`. Mutations from feature hooks already toast.

## Page skeleton template
```tsx
"use client";
import { PageHeader } from "@/components/shared/page-header";
export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="…" description="…" actions={<…/>} />
      {/* content: KPIs grid → charts → table; loading & empty states */}
    </div>
  );
}
```

## Verify before finishing
Run `node node_modules/typescript/bin/tsc --noEmit` from `frontend/` — it must exit 0. Fix any type errors you introduce. Do not edit foundation files unless strictly necessary.
