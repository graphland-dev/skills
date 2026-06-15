# Worked example — waland (the source system)

The generic templates were extracted from waland's production billing system (a multi-tenant WhatsApp messaging SaaS). Seeing the concrete model clarifies how to map the generic skeleton onto a real domain.

## waland's catalog

| Plan | Price | Connections | Messages/month | Rate | Members | Features |
| --- | --- | --- | --- | --- | --- | --- |
| Trial (2 days) | — | 1 | 25 *total* (lifetime) | 5/min | 1 | campaigns |
| Silver | 480 BDT | 1 | 1,200 | 10/min | 1 | — |
| Pro | 975 BDT | 5 | 40,000 | 100/min | 10 | campaigns, webhooks, aiMessageGeneration |
| Enterprise | custom | ∞ | ∞ | 500/min | ∞ | all (+ per-org overrides) |

## Generic skeleton → waland mapping

| Template (generic) | waland (real) |
| --- | --- |
| `maxItems` | `maxConnections` (WhatsApp sessions) |
| `maxRequestsPerPeriod` | `maxMessagesPerPeriod` |
| `maxRequestsPerMinute` | `maxMessagesPerMinute` |
| `maxSeats` | `maxMembers` |
| `requestsUsed` counter | `messagesSent` counter |
| `assertCanUse` | `assertCanSend` (status + message quota + rate) |
| `recordUsage` | `recordMessageSent` (after terminal `sent` ack only — failed sends don't count) |
| `assertCanCreateItem` | `assertCanCreateConnection` |
| features `advancedReports/apiAccess/webhooks` | `campaigns/webhooks/aiMessageGeneration` |

## Where waland applies each gate

- `MessageService.send()` → `assertCanSend` before, `recordMessageSent` after a successful ack.
- `SessionService.create()` → `assertCanCreateConnection`.
- `CampaignService.create()/start()` → `assertFeature('campaigns')`.
- `SessionWebhookService.createWebhook()` → `assertFeature('webhooks')`.
- Member invite/accept → Better Auth hooks call seat checks (not `EntitlementService`, to avoid a circular dep).

## Reference docs in the source repo

If you have access to the waland repo, the canonical specs are:
- `docs/BILLING-PLAN.md` — full spec: catalog, lifecycle, enforcement map, error codes, crons, env.
- `docs/BILLING-SUBSCRIPTION-FLOW.md` — step-by-step flows mapped to real MongoDB documents.

These are excellent models for writing your own project's `docs/BILLING.md`.
