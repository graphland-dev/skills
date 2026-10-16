---
name: gl-pgw
description: >-
  Subscription billing, plans, paywalls, and feature entitlements for any
  Graphland app using Graphland PGW (@graphland/pgw-merchant: core client,
  /nest, /react). Ships copy-ready templates for a shared feature-keys package,
  the NestJS side (PGWBilling module + env, checkout and pay-invoice proxy,
  tenant provisioning, boolean feature guard, quota checks) and the React
  console side (PgWProvider workspace gate, feature gates, usage bars, plan
  comparison, billing page with overview/plans/invoices/quotations, expired
  and choose-a-plan screens). Use whenever a task mentions PGW, billing,
  pricing plans, subscriptions, upgrade prompts, "lock this behind a plan",
  "limit how many X per plan", entitlements, checkout, trial/grace/expired
  states, or wiring a new app to Graphland billing, even if the user doesn't
  say "PGW". Invoke as /gl-pgw.
---

# Graphland PGW (`/gl-pgw`)

Add subscription billing and entitlement enforcement to a Graphland app. PGW
is the billing system; the app proxies checkout, enforces entitlements, and
renders billing UI. The templates are a working reference implementation.
Copy them and adapt names, routes, tenant identity, and feature keys.

## The ownership rule

**PGW owns billing state. Your app owns enforcement and UI.**

| PGW owns (configure in the PGW console or API) | Your app owns |
| --- | --- |
| Features (keys and types), plans, price variants, add-ons | The feature-key constants your code references |
| Customers, subscriptions, trials, grace, renewals, plan changes | Mapping your tenant/org to a `billingCustomerId` |
| Invoices, quotations, hosted checkout, payment settlement | A server-side checkout proxy (the private key stays on the server) |
| Entitlement grants, limits, usage ledger | Server enforcement (guard + quota checks) plus UI gates |

Don't build local subscription, plan-price, or billing-invoice tables, renewal crons, or projections of settlement webhooks. They duplicate PGW and drift.

## Keys and identity

- **Private API key** (`PGW_API_KEY`): API only. It covers checkout, `payInvoice`, `consume`, `check`, provisioning, and plan changes.
- **Public API key** (`VITE_PGW_PUBLIC_API_KEY`): safe in the browser. It can only read the published catalog, customer bootstrap, invoices, and quotations.
- **`clientId`**: your app's lowercased slug in PGW. Every feature key is scoped to it.
- **`billingCustomerId`**: one stable id per paying unit — the tenant UID in the templates. Use it everywhere: provider, gateway, consume, checkout `organizationId`. Changing it later orphans subscriptions.

## Entitlement types drive enforcement

| Type | Semantics | Server enforcement | UI |
| --- | --- | --- | --- |
| `boolean` | Access on/off | Gate catalog → `FeatureEntitlementGuard` → `getEntitlement().allowed` | `FeatureGate` page lock, nav lock, `FeatureGateAction` |
| `non_consumable` | Capacity ("max N existing") | `EntitlementService.assertAndConsume({ currentQuantity })` → `check` (nothing recorded) | `EntitlementUsageProgress`; hide create when full |
| `consumable` | Metered balance | `EntitlementService.assertAndConsume({ requestId })` → `consume(1)` | Usage bar |

**Trap:** `EntitlementService.assertAndConsume` **throws for boolean features**. Boolean flags go through `FeatureEntitlementService` (template), never `assertAndConsume`.

## Templates

```
templates/
├── feature-keys/                     # framework-free package, imported by API + console
│   └── src/{features,feature-gates,index}.ts
├── api/                              # NestJS (matches gl-workspace-setup api-jwt layout)
│   ├── src/config/pgw.config.ts      # pgwEnvSchema (Joi) + PgwBillingModule (forRootAsync)
│   ├── src/api/billing/
│   │   ├── billing.module.ts         # providers + global FeatureEntitlementGuard
│   │   ├── pgw-checkout.service.ts   # catalog-validated checkout + payInvoice, return URLs
│   │   ├── pgw-billing.resolver.ts   # billing__createCheckout / billing__payInvoice
│   │   ├── pgw-billing.controller.ts # REST variant (use one of resolver/controller)
│   │   ├── pgw-billing.dto.ts
│   │   ├── feature-entitlement.service.ts   # boolean feature check
│   │   └── billing-provisioning.service.ts  # ensureBillingAccount + display name on tenant create
│   ├── src/authorization/
│   │   ├── feature-entitlement.guard.ts     # global, catalog-driven
│   │   └── require-feature.decorator.ts     # escape hatch for REST handlers
│   └── examples/quota-in-service.example.ts # non_consumable, consumable, quantity > 1, provisioning call
└── console/src/                      # React (matches gl-workspace-setup console-jwt layout)
    ├── lib/pgw-catalog.ts            # usePgwCatalog, public catalog fetch, format helpers
    ├── lib/billing-api.ts            # gql mutations + useCreateCheckout / usePayInvoice
    ├── hooks/use-feature-access.ts   # wrapper hooks + the ONE missing-key policy
    ├── components/billing/
    │   ├── billing-workspace.tsx     # PgWProvider + subscription-status gate
    │   ├── plan-comparison.tsx       # cycle toggle, plan cards, checkout
    │   ├── expired-subscription.tsx  # pay outstanding invoice or pick a plan
    │   ├── feature-gate.tsx          # FeatureGate, FeatureGateAction, LockedFeature
    │   └── usage-progress.tsx        # EntitlementUsageProgress, UsageBar
    └── routes/merchant/$tenant/billing/
        ├── index.tsx                 # search schema (tab, checkout)
        ├── index.lazy.tsx            # tabs + checkout-return handling
        └── ~components/{subscription-overview,invoice-history,quotation-history}.tsx
```

Template assumptions (adapt if the host differs):

- **API**: `@/` path alias; `@Authenticated()`, `@TenantName()` (reads `x-tenant`), `@AuthenticatedUser()` from `src/authorization/` (gl-workspace-setup `api-jwt`). For Better Auth APIs, swap `@TenantName()` for `@OrganizationId()` and read the tenant the same way in the guard. Errors use Nest `ForbiddenException` / `BadRequestException`; swap for the host's exception class if it has one.
- **Console**: `gqlRequest({ query, variables, tenant })` and `gql` from `@/lib/gql-client`, `FormError` from `@/components/form`, `formatDate` / `formatDateTime` from `@/lib/format`, `env` from `@/lib/env`, shadcn `@/components/ui/*`, `sonner`, TanStack Router + Query. Tenant routes live under `/merchant/$tenant`.
- **Shared package**: `@app/feature-keys` (workspace package). Rename to the project scope.

## Build order

1. **PGW catalog**: features, plans (with a free baseline), and variants are published for your `clientId`. Gating on a key PGW doesn't know returns `NOT_FOUND`.
2. **Feature keys**: copy `templates/feature-keys/`, replace the example keys with the real PGW keys, and map gated boolean operations in `featureGateCatalog`. → [references/feature-keys.md](references/feature-keys.md)
3. **API**: `bun add @graphland/pgw-merchant`, spread `pgwEnvSchema` into the env schema, import `PgwBillingModule` then `BillingModule` in `AppModule`, call `BillingProvisioningService.provision()` after tenant create, add `assertAndConsume` to quota-owning services. → [references/server-nest.md](references/server-nest.md)
4. **Console**: add the `VITE_PGW_*` vars to `env.ts`, wrap the tenant layout in `<BillingWorkspace>`, copy the billing route, put `FeatureGate` / `FeatureGateAction` / `EntitlementUsageProgress` on gated pages, and add a Billing nav item. → [references/client-react.md](references/client-react.md)
5. **Verify** with the checklist in [references/recipes.md](references/recipes.md), which also has task recipes (add a paid feature, add a quota, add a billing cycle, debug a lock).

For the exact SDK surface (methods, types, statuses, errors, webhooks), see [references/sdk-api.md](references/sdk-api.md).

## Non-negotiables

1. **Enforce on the server; the UI only mirrors it.** Every UI gate needs a server counterpart: the gate catalog for boolean, `assertAndConsume` for quotas.
2. **Never ship the private key to a bundle.** Grep the console for `PGW_API_KEY` before finishing.
3. **Same `billingCustomerId` everywhere**, resolved from trusted tenant context (header + membership check, or JWT) — never from the request body.
4. **Idempotency on every billing write.** Natural keys (`<client>:<feature>:<tenant>:<handle>`) so retries dedupe; a random UUID only when each call is a new unit (e.g. an order).
5. **Quota checks run immediately before the write**, in the service, with `currentQuantity` counted the same way the UI counts.
6. **Select variants by `variantKey`**, never months. 365 ≠ 12 × 30.
7. **Refresh the snapshot after any billing change.** The billing page refreshes on `?checkout=success` and again shortly after, because settlement is async.
8. **One missing-key policy**, in `use-feature-access.ts`. The template is fail-closed to match the server.
9. **Billing stays reachable in every subscription status** — `BillingWorkspace` always lets the billing route through.
10. **Server errors never go in toasts.** Checkout, pay-invoice, and load failures render in `FormError`; toasts are success-only.

## Don't confuse with

- **`@graphland/pgw-merchant/system`** (bKash/SSLCommerz adapters): processes *your merchants' customers'* payments with merchant-owned credentials. Different problem from your app's own subscription billing.
- Domain entities called "invoice" or "order" in your app are not PGW billing invoices. PGW invoices come from `useCustomerInvoices()` and `getCustomerInvoices()`.

## Sources of truth

- SDK docs: `node_modules/@graphland/pgw-merchant/README.md`, plus the `/nest` and `/react` READMEs in the PGW repo at `packages/merchant-sdk/src/{nest,react}/README.md`.
- PGW internals and ADRs (entitlement resolution, plan changes, trial/grace): the PGW repo `docs/billing-architecture.md` and `docs/adr/`.
- Templates target SDK **3.4.0**. On another version, re-check signatures in `node_modules/@graphland/pgw-merchant/dist/**/*.d.ts` before copying.
