# Data model — subscriptions, usage, invoices

## The one idea: entitlements are computed, never stored

You never write "this org can use webhooks" to a row. You store the **subscription** (plan + status + period) and **usage counters**, then resolve effective limits/features on demand from the catalog. This means a plan price/limit change takes effect everywhere instantly, and the API and frontend can't drift (they resolve from the same shared package — see [shared-package.md](shared-package.md)).

## Three collections (all org-scoped)

| Collection | Cardinality | Holds | Template |
| --- | --- | --- | --- |
| `subscriptions` | one per org (`organizationId` unique) | `planSlug`, `status`, `trialEndsAt`, `currentPeriodStart/End`, `cancelAtPeriodEnd`, `customLimits/customFeatures` overrides | `templates/api/entities/subscription.entity.ts` |
| `usage_counters` | one per org × period | `periodKey`, metered columns (`requestsUsed`, …); unique `{organizationId, periodKey}` | `templates/api/entities/usage-counter.entity.ts` |
| `billing_invoices` | many per org | gateway mirror + idempotent `identifier`, `termMonths`, `amount`, `status`, `purpose` | `templates/api/entities/billing-invoice.entity.ts` |

On org delete, purge all three (each repository has `deleteByOrganizationId`).

## Subscription status lifecycle

```
trialing ──trial ends (cron)──▶ awaiting_payment ──payment.paid──▶ active
   └──early checkout paid──▶ active                                   │
active ──period ending (cron)──▶ awaiting_payment ──unpaid──▶ past_due ──grace exceeded──▶ expired
expired/past_due ──payment.paid──▶ active
```

| Status | Can act? | Effective entitlements |
| --- | --- | --- |
| `trialing` | yes | trial profile (regardless of stored `planSlug`) |
| `active` | yes | `planSlug` from catalog (+ enterprise overrides) |
| `awaiting_payment` / `past_due` / `expired` | **no** | blocked: limits → 0, features → false |

## Period keys (usage scope)

`getPeriodKey(orgId, status)` in the shared package:
- `trialing` → `trial:{orgId}` — lifetime cap, never resets.
- `active` → `YYYY-MM` (UTC) — resets each calendar month, matching "N / month" marketing.
- blocked → `null` — nothing is metered.

This decouples the **billing period** (`currentPeriodEnd`, how long they've paid) from the **quota period** (monthly reset) — a 12-month prepay still resets the monthly request quota each month.

## Trial

Seeded on org creation (`SubscriptionService.seedTrialForOrganization`, called from your org-create hook). Default-paid `planSlug` is stored but the trial profile applies while `status = trialing`. Users may pay early; the webhook flips them to `active` immediately.

## Worked example

See [waland-example.md](waland-example.md) for the real messages/connections/members model this pattern was extracted from.
