---
name: gl-pgw-billing
description: >-
  How to implement subscription billing, plans, paywalls, and feature
  entitlements in any Graphland app using Graphland PGW
  (@graphland/pgw-merchant: core client, /nest, /react). Covers server setup,
  tenant provisioning, the secure checkout proxy, pay-pending-invoice, boolean
  feature gates, usage quotas (non_consumable / consumable with
  assertAndConsume), subscription-status gating, PgWProvider/FeatureGate UI,
  billing pages (plans, invoices, quotations), and shared feature-key catalogs.
  Use whenever a task mentions PGW,
  billing, pricing plans, subscriptions, upgrade prompts, "lock this behind a
  plan", "limit how many X per plan", entitlements, checkout, trial/grace/expired
  states, or wiring a new app to Graphland billing, even if the user doesn't
  say "PGW". Invoke as /gl-pgw-billing.
---

# Graphland PGW billing (`/gl-pgw-billing`)

Use this skill to add subscription billing and entitlement enforcement to a
Graphland app. The patterns are app-agnostic; adapt names, routes, tenant
identity, feature keys, and error handling to the host application.

## The ownership rule

**PGW owns billing state. Your app owns enforcement and UI.**

| PGW owns (configure in the PGW console or API) | Your app owns |
| --- | --- |
| Features (keys and types), plans, price variants, add-ons | The feature-key constants your code references |
| Customers, subscriptions, trials, grace, renewals, plan changes | Mapping your tenant/org/user to a `billingCustomerId` |
| Invoices, quotations, hosted checkout, payment settlement | A server-side checkout proxy (the private key stays on the server) |
| Entitlement grants, limits, usage ledger | Server enforcement (guards and quota checks) plus UI gates |

Don't build local subscription, plan-price, or billing-invoice tables, renewal crons, or projections of settlement webhooks. They duplicate PGW and drift. Only cache something if you've measured a real need, and treat it as disposable.

## Keys and identity

- **Private API key** (`PGW_API_KEY`): server only. It covers checkout, `payInvoice`, `consume`, `check`, provisioning, and plan changes.
- **Public API key** (`VITE_PGW_PUBLIC_API_KEY` or equivalent): safe in the browser. It can only read the published catalog, customer bootstrap, invoices, and quotations.
- **`clientId`**: your app's lowercased slug in PGW. Every feature key is scoped to it.
- **`billingCustomerId`**: pick one stable id per paying unit, usually the tenant or org id, and use it everywhere: provider, gateway, consume, and checkout `organizationId`. Changing it later orphans subscriptions.

## Entitlement types drive enforcement

Every PGW feature has a `type`. Look it up in the catalog before choosing how to enforce it.

| Type | Semantics | Server enforcement | UI |
| --- | --- | --- | --- |
| `boolean` | Access on/off | `gateway.getEntitlement(id, key).allowed` in a guard or service (a **custom** helper, see below) | Lock the page or nav; "Upgrade" CTA |
| `non_consumable` | Capacity limit (count of things that exist) | `EntitlementService.assertAndConsume({ currentQuantity })` → `check` (nothing is consumed) | Usage bar; hide or disable create when full |
| `consumable` | Metered balance that decrements | `EntitlementService.assertAndConsume({ requestId })` → `consume(1)` | Balance or usage bar |

**Trap:** the SDK's `EntitlementService.assertAndConsume` **throws for boolean
features** ("not configured for usage limits"). Boolean flags need a small
helper that checks `getEntitlement(...).allowed`. See
[references/server-nest.md](references/server-nest.md#boolean-features).

## Implementation layers (build in this order)

1. **PGW catalog**: features, plans, and variants exist and are published for your `clientId`. You can't gate on a key PGW doesn't know, because the server returns `NOT_FOUND`.
2. **Shared feature keys**: one constants module that both server and client import, plus an operation → feature gate map. → [references/feature-keys.md](references/feature-keys.md)
3. **Server**: detect the host framework first, then wire the SDK module.
   - **NestJS**: register `PGWBilling.forRootAsync(...)` (the `/nest` subpath, aliased `PGWBillingModule`) as a **global** module before anything else — it provides `PAYMENT_GATEWAY` (inject via `@Inject(PAYMENT_GATEWAY) gateway: PaymentGateway`), `EntitlementService`, and `PGW_BILLING_CONFIG`. Config (`PGWBillingConfig`: `apiKey`, `clientId` required; `baseUrl?`, `consoleUrl?`, `displayName?`, `defaultPlanKey?`, `defaultPriceVariantKey?`, `checkoutReturnPath?` optional) comes from a `useFactory` reading `ConfigService`, not hardcoded — `consoleUrl` is type-optional but needed in practice to build checkout return URLs. Missing `apiKey`/`clientId` makes the gateway log a warning and no-op/throw on use — validate env at boot (Joi/zod) so prod can't start without them. → [references/server-nest.md § Module setup](references/server-nest.md#1-module-setup)
   - **Not NestJS**: use `GraphlandPGWClient` directly (same method names, no module/DI layer) and recreate the boolean/quota guard as framework middleware. → [references/server-nest.md § Without Nest](references/server-nest.md#7-without-nest)
   - Then, regardless of framework: provisioning on tenant create, checkout and pay-invoice proxy, boolean guard, quota checks in services. → [references/server-nest.md](references/server-nest.md)
4. **Client**: `PgWProvider` per active customer, subscription-status gate, page, action, and nav gates, usage bars, and a billing page with plans, invoices, and quotations, plus checkout return handling. → [references/client-react.md](references/client-react.md)
5. **Verify** with the checklist in [references/recipes.md](references/recipes.md). That file also has task recipes (add a paid feature, add a quota, add a billing cycle, debug a lock).

For the exact SDK surface (methods, types, statuses, errors, webhooks), see [references/sdk-api.md](references/sdk-api.md).

## Non-negotiables

1. **Enforce on the server; the UI only mirrors it.** `FeatureGate` is a hint. Every gated write needs a server check with the private key.
2. **Never ship the private key to a bundle.** Only the public key goes in the browser. Grep client apps for `PGW_API_KEY` before you finish.
3. **Same `billingCustomerId` everywhere.** The server usually resolves it from the request's tenant context (header or JWT), never from untrusted body input.
4. **Idempotency on every billing write.** Use `requestId` for consume and an `idempotencyKey` for customer, subscription, and purchase calls. Prefer natural keys (`<client>:<feature>:<tenant>:<handle>`) so retries dedupe. Use a random UUID only when each call really is a new unit.
5. **Quota checks run before the write**, in the service, with a `currentQuantity` counted the same way the UI counts.
6. **Select variants by `variantKey` or `billingCycleDays`, not months.** Don't convert days to months and back, because 365 ≠ 12×30.
7. **Refresh the snapshot after any billing change.** Bootstrap is point-in-time, so call `refresh()` after returning from checkout.
8. **Decide the missing-key policy on purpose.** The PGW server rejects unknown keys, while UI hooks report `state: "missing"`. Choose fail-closed (safer) or fail-open (useful for staged catalog rollouts) and document it. Never let UI and server disagree silently.
9. **Follow the host app's error conventions.** In Graphland consoles, mutation errors go in the form or page error area. Toasts are for success.

## Don't confuse with

- **`@graphland/pgw-merchant/system`** (bKash/SSLCommerz adapters): these process *your merchants' customers'* payments with credentials the merchant owns. That's a different problem from your app's own subscription billing.
- Domain entities called "invoice" or "order" in your app are not PGW billing invoices. PGW invoices come from `useCustomerInvoices()` and `getCustomerInvoices()`.

## Sources of truth

- SDK docs: `node_modules/@graphland/pgw-merchant/README.md`, plus the `/nest` and `/react` READMEs in the PGW repo at `packages/merchant-sdk/src/{nest,react}/README.md`.
- PGW internals and ADRs (entitlement resolution, plan changes, trial/grace): the PGW repo `docs/billing-architecture.md` and `docs/adr/`. Find the local checkout with `find ~/code ~/project -maxdepth 3 -iname graphland-pgw 2>/dev/null` if its path isn't already known.
- If the installed SDK version differs from 3.4.0, re-check signatures in `node_modules/@graphland/pgw-merchant/dist/**/*.d.ts` before relying on this skill.
