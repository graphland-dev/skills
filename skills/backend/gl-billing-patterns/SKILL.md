---
name: gl-billing-patterns
description: GraphLand's subscription, payment, and entitlement guideline — org-scoped plans with a shared catalog package imported by both API and frontend, computed-not-stored entitlements, imperative EntitlementService.assert* enforcement (feature gates, usage quotas, rate limits, resource caps), a provider-agnostic payment-gateway adapter with webhook-as-source-of-truth, and trial/renewal lifecycle crons. Use when building or reviewing subscriptions, billing, paywalls, plan tiers, usage quotas, feature gating, metered limits, multi-tenant SaaS entitlements, or payment webhooks.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-source: waland (apps/api/src/api/billing, packages/plans, apps/console)
---

# GraphLand Billing & Entitlements

The company guideline for org-scoped subscription billing + entitlement enforcement, extracted from the production waland platform. Stack: NestJS + Mongoose API, a shared `@app/plans` TypeScript package, React console gates. Builds on `gl-api-patterns` (modules, org multi-tenancy) and `gl-console-patterns` (frontend).

**The core idea: entitlements are computed, never stored.** A shared package holds the plan catalog + pure resolver/check functions, imported by *both* the API (authoritative enforcement) and the console (read-only UX gates), so they can never disagree.

**Copy, don't re-derive.** `templates/plans/` is the shared package, `templates/api/` the NestJS billing module, `templates/console/` the frontend gates. Scaffold with the `gl-billing-module` skill. Start by reading [shared-package.md](references/shared-package.md) — it's the keystone.

## Pattern map

| Pattern | Rule of thumb | Reference |
| --- | --- | --- |
| Data model | `subscriptions` (one/org) + `usage_counters` (per period) + `billing_invoices`; status lifecycle; period keys; trial seeded on org-create | [references/model.md](references/model.md) |
| Shared package | `@app/plans`: catalog + `resolveEffectiveEntitlements`/`getPeriodKey`/checks; imported by API and frontend alike | [references/shared-package.md](references/shared-package.md) |
| Enforcement | imperative `EntitlementService.assert*` before the gated action; feature gate vs quota vs rate vs resource cap; optional `@RequiresFeature` guard; `code`-based errors | [references/enforcement.md](references/enforcement.md) |
| Payments | provider-agnostic `PaymentGateway` adapter; webhook (raw-body HMAC) is the source of truth; idempotent checkout; lifecycle crons | [references/payments.md](references/payments.md) |
| Frontend gating | `useEntitlements` + `useFeatureGate`; `FeatureGateButton`/`PlanFeatureGate`/`BillingBanner`; UX only, server enforces | [references/frontend-gating.md](references/frontend-gating.md) |
| Worked example | waland's real messages/connections/members model mapped onto the generic skeleton | [references/waland-example.md](references/waland-example.md) |

## Core principles

1. **Computed, not stored.** Store subscription + usage; resolve limits/features from the catalog at request time.
2. **One shared package.** API and frontend import the same resolver — never duplicate plan logic per app.
3. **Server enforces, UI hints.** Every gate is an API `assert*`; the console only disables buttons and shows upgrade prompts.
4. **Webhook is the source of truth.** Redirect URLs never activate a subscription; only a signature-verified webhook (over raw bytes) does.
5. **Blocked means blocked.** `awaiting_payment`/`past_due`/`expired` zero out every limit and feature in one place (`getBlocked*`).
6. **Branch on `code`, not message text.** Errors carry a stable `BillingErrorCode`.
