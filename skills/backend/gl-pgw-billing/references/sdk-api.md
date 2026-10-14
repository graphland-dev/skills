# `@graphland/pgw-merchant` quick reference (v3.4.0)

Full docs are in `node_modules/@graphland/pgw-merchant/README.md`. Types are in `dist/types.d.ts`.

## Subpaths

| Import | For |
| --- | --- |
| `@graphland/pgw-merchant` | `GraphlandPGWClient`, types, webhook verify/parse, error classes |
| `/nest` | `PGWBilling` / `PGWBillingModule`, `PAYMENT_GATEWAY`, `PaymentGateway`, `PgwGateway`, `EntitlementService`, `PGW_BILLING_CONFIG` |
| `/react` | `PgWProvider`, `FeatureGate`, `usePgWContext`, `useEntitlements`, `useEntitlement`, `useFeaturePermission`, `useSubscription`, `useCustomerInvoices`, `useCustomerQuotations` |
| `/system` | bKash and SSLCommerz adapters for merchant-owned credentials. Not subscription billing. |

## `PaymentGateway` (Nest, private key)

| Method | Notes |
| --- | --- |
| `ensureBillingAccount?(id)` | Customer plus default plan/variant. Idempotent. No-op if not configured. |
| `getCatalog()` | Plans (`planKey`, `priceVariants[{variantKey, billingCycleDays, price}]`, `entitlements`), add-ons, features |
| `getBootstrap(id)` | catalog + subscription + pendingInvoice + entitlements + trial flags |
| `getEntitlement(id, key)` | `{ type, allowed, effectiveLimit?, remaining?, consumed? }`. Unknown key → `NOT_FOUND` error. |
| `check({ billingCustomerId, featureKey, currentQuantity, requestedQuantity })` | Returns `allowed:false, code:"ENTITLEMENT_EXCEEDED"`. Doesn't throw. |
| `consume({ billingCustomerId, featureKey, quantity, requestId })` | Idempotent on `requestId` |
| `createCheckoutSession({ organizationId, planKey, priceVariantKey, customerName?, customerEmail?, customerPhone?, successUrl?, cancelUrl?, failUrl? })` | → `{ sessionId, redirectUrl, invoiceId }`. PGW chooses create vs change. |
| `payInvoice({ invoiceNumber, successUrl?, cancelUrl?, failUrl? })` | Reopens hosted checkout. Creates no invoice. |

`EntitlementService.assertAndConsume({ tenant, featureKey, currentQuantity, requestId? })` handles consumable (consume 1) and non_consumable (check). It throws `ForbiddenException` on denial and **throws for boolean**.

## `GraphlandPGWClient` extras (private key unless noted)

`ensureCustomer(id, { displayMetadata }, idemKey)` · `createSubscription` · `getSubscription` · `changePlan(subId, { planKey, priceVariantKey }, idemKey)` returns a *new* subscription id (upgrade prorates, downgrade schedules at period end) · `cancelPlanChange` · `cancelSubscription` (at period end) · `createPurchase({ billingCustomerId, addonKey, successUrl })` for add-ons · `explainEntitlement(id, key)` shows contributing grants · `getCustomerInvoices` / `getCustomerQuotations` (public OK) · `getPublicPreview(uid, { payNow? })` · `getInvoiceDocument(uid)`.

Config: `{ apiKey, clientId, baseUrl?, timeout? = 15000, retries? = 0, retryDelayMs? = 200 }`. Retries apply only to GETs and idempotent writes.

## Enums

- `BillingFeatureType`: `boolean | non_consumable | consumable`
- `SubscriptionStatus`: `pending_payment | active | trialing | past_due | cancellation_scheduled | cancelled | expired | scheduled | superseded`
- `InvoiceStatus`: `pending | paid | failed`
- `QuotationStatus`: `sent | accepted | declined | expired` (drafts are never returned)
- `PurchaseStatus`: `pending_payment | active | cancelled | failed`
- Grant source: `plan | addon | override | manual`

## Resolution rules (PGW ADR-0009 and ADR-0014)

- Boolean: allowed if any active grant has value > 0.
- Non-consumable limit: sum of `limitDelta` across active grants (plan + add-ons).
- Consumable remaining: sum of `balanceGrant` minus the usage ledger. `-1` means unlimited.
- Only active, started, unexpired grants count. Pending or failed payments grant nothing.
- Upgrades prorate and apply on settlement. Downgrades apply at period end.

## Errors and webhooks

- Errors: `ApiError` (`statusCode`, `code`, `body`), `ValidationApiError`, `ConflictApiError`, `EntitlementExceededApiError`.
- Webhooks (`payment.created | payment.paid | payment.failed | payment.refunded`) are for **one-off invoices you create**. Verify them with `verifyWebhookSignature(rawBody, { signature, timestamp }, secret)`. Subscription state is applied inside PGW. For billing, re-read the bootstrap instead of projecting webhooks.
