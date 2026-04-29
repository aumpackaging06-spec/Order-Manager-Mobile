# AUM Packaging — Customer Order Management

A mobile-first PWA-style order management web app for AUM Packaging (an Indian PET preform/bottle/cap manufacturer). Multi-role workflow: customers submit requirements → sales sends a quotation → customer accepts → production → dispatch → invoice → payment.

Tagline: **Where Quality Meets Excellence**.

## Architecture

Monorepo (pnpm workspaces). Three artifacts plus shared libs.

- `artifacts/aum-app` — React + Vite + wouter + TanStack Query + shadcn/ui frontend (path `/`).
- `artifacts/api-server` — Express 5 + Drizzle backend (path `/api`).
- `lib/api-spec` — OpenAPI source of truth (`openapi.yaml`).
- `lib/api-client-react` — codegen of TanStack Query hooks.
- `lib/api-zod` — codegen of Zod request/response schemas.
- `lib/db` — Drizzle schema + Postgres pool. Tables in `lib/db/src/schema/` (one per domain).

Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`.
Push DB schema changes with `pnpm --filter @workspace/db run push`.

## Domain model

Roles: `customer`, `sales`, `accounts`, `dispatch`, `super_admin`. Customers are scoped to their own `customerId`; team users see all data.

Order status enum (linear-ish flow): `requirement_received` → `quotation_sent` → (`quote_revision_requested` | `quote_accepted`) → `order_confirmed` → `in_production` → `ready_for_dispatch` → `partially_dispatched` → `fully_dispatched` → `invoice_generated` → `payment_pending` → `payment_received` → `order_closed`.

Key tables: `customers`, `users`, `products`, `orders`, `order_status_history`, `quotations`, `dispatch_documents`, `payments`, `payment_proofs`, `notifications`, `session` (connect-pg-simple compatible).

## Auth

Cookie sessions via `express-session` + `connect-pg-simple`. Passwords hashed with `bcryptjs`. Session cookie `aum.sid`. The frontend `useAuth()` hook wraps `useGetCurrentUser` / `useLogin` / `useLogout`. The Vite dev server proxies `/api` through the shared proxy so cookies just work.

## Demo credentials (all `password123`)

- `aarav@bluewave.in` — customer (Bluewave Beverages)
- `neha@sparklemineral.in` — customer (Sparkle Mineral)
- `sales@aumpackaging.in` — sales
- `accounts@aumpackaging.in` — accounts
- `dispatch@aumpackaging.in` — dispatch
- `admin@aumpackaging.in` — super_admin

The login page has 1-tap demo chips for the 5 main roles.

## Seeding

`pnpm --filter @workspace/api-server run seed` — idempotent (no-op if any user exists). Seeds 3 customers, 8 products, 6 users, 8 orders across the full status spectrum, plus quotations, dispatch documents, payments, and notifications.

## Brand & UI

- Palette: deep corporate blue primary, refined gold accent, soft neutral background.
- Customer role gets a sticky bottom-nav (Home / Orders / Notifications / Profile).
- Internal team gets a desktop sidebar + mobile bottom-nav.
- Status badges use soft tinted backgrounds via a single `getStatusMeta()` helper in `src/lib/constants.ts`.

## Hooks reference (frontend)

All from `@workspace/api-client-react`:

- Auth: `useLogin`, `useLogout`, `useGetCurrentUser`
- Customers: `useListCustomers`, `useCreateCustomer`, `useGetCustomer`
- Products: `useListProducts`
- Orders: `useListOrders`, `useCreateOrder`, `useGetOrder`, `useUpdateOrderStatus`
- Quotations: `useCreateQuotation`, `useRespondToQuotation`
- Dispatch: `useListDispatchDocuments`, `useAddDispatchDocument`
- Payments: `useListOrderPayments`, `useCreatePayment`, `useSubmitPaymentProof`, `useReviewPaymentProof`
- Notifications: `useListNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`
- Dashboards: `useGetCustomerDashboard`, `useGetAdminDashboard`, `useGetCustomerOutstanding`, `useGetProductSummary`

Mutation hooks take `{ orderId, data }` (or `{ paymentId, data }`, `{ notificationId }`). Always pass `queryKey` when overriding `query` options on `useQuery` hooks.
