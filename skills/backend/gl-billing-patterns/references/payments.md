# Payments — gateway adapter, webhooks, lifecycle

## Provider-agnostic by design

The billing service depends only on the **`PaymentGateway` interface** (`templates/api/gateway/payment-gateway.interface.ts`), bound to the `PAYMENT_GATEWAY` token. Swap providers by writing a new adapter — subscription/entitlement logic never changes. The shipped reference adapter is Graphland PGW (`pgw.gateway.ts`); for Stripe/Paddle, implement the same four methods.

```ts
interface PaymentGateway {
  isConfigured(): boolean;
  createInvoice(input): Promise<{ gatewayInvoiceId; paymentUrl }>;
  getInvoiceStatus(id): Promise<'pending' | 'paid' | 'failed'>;
  verifyAndParseWebhook(rawBody, headers): NormalizedWebhookEvent | null;
}
```

## Webhook is the source of truth

**Only a verified webhook mutates the subscription.** Success/cancel redirect URLs must never activate anything — a user can close the tab before redirect, or forge the redirect. The webhook controller (`billing-webhook.controller.ts`):

1. Reads the **raw request body** (enable `NestFactory.create(AppModule, { rawBody: true })`). Signature verification needs exact bytes, not the JSON-parsed body.
2. Calls `gateway.verifyAndParseWebhook(rawBody, headers)` → null on bad signature → 401.
3. Switches on `payment.paid` / `payment.failed` → `BillingService`.
4. Is anonymous to user auth (authenticity is the signature).

`payment.paid` → mark invoice paid, set `active`, set `currentPeriodStart`, extend `currentPeriodEnd` by `termMonths` (added to the existing end on early renewal). `payment.failed` on a renewal → `past_due`.

## Checkout & idempotency

`POST /v1/billing/checkout { planSlug, termMonths }`:
1. `computeCheckoutAmount(planSlug, termMonths)` applies the term discount (major currency units).
2. Build an idempotent `identifier` — `sub:{orgId}:activate:{term}m:{contextDate}` (contextDate = `trialEndsAt` for initial, `currentPeriodEnd` for renewal).
3. `gateway.createInvoice(...)` with `metadata: { planSlug, termMonths }` (echoed back on the webhook).
4. Persist a local `billing_invoices` row; return `{ paymentUrl }`. The console redirects.

A retried checkout with the same `identifier` reuses the pending invoice rather than double-charging.

## Lifecycle crons (`billing.scheduler.ts`, needs `ScheduleModule.forRoot()`)

| Job | Cadence | Action |
| --- | --- | --- |
| trial-expiry | hourly | `trialing` past `trialEndsAt` → `awaiting_payment` + default 1-month invoice |
| renewal-reminder | daily | `active` ending ≤30d (and not `cancelAtPeriodEnd`) → renewal invoice |
| past-due-expiry | daily | `active` ended → `awaiting_payment`; `awaiting_payment` past end → `past_due`; `past_due` past grace → `expired` |

Grace window: `BILLING_GRACE_PERIOD_DAYS` (default 7). Each job guards against overlap and isolates per-org errors.

## Env vars

```bash
# Gateway (PGW reference adapter)
PGW_API_KEY=
PGW_CLIENT_ID=
PGW_WEBHOOK_SECRET=
# PGW_BASE_URL=https://pgw.graphland.dev

# Billing policy
BILLING_CURRENCY=USD
BILLING_TRIAL_DAYS=14
BILLING_GRACE_PERIOD_DAYS=7
BILLING_CONSOLE_URL=http://localhost:5173
```

Add these to the Joi env schema (gl-api-patterns config pattern) so a missing webhook secret fails at boot.
