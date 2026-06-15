---
name: gl-billing-module
description: Add org-scoped subscription billing and entitlement enforcement to a GraphLand fullstack project — copy the shared plans package, the NestJS billing module (subscriptions, usage, invoices, EntitlementService, payment-gateway adapter, webhook, lifecycle crons), and the console gates, then wire them up. Use when adding subscriptions, plans, paywalls, usage limits, or feature gating to an existing project.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-invocation: "manual"
---

> **Locating sibling skills:** paths like `gl-billing-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/backend/`).

Add the subscription/entitlement system to a project, following the GraphLand billing guideline (`gl-billing-patterns/SKILL.md` — read it first, especially `references/shared-package.md`).

## 0. Preconditions

- A bun-workspace monorepo (`gl-workspace-setup`) with a NestJS API (`gl-api-patterns`, org multi-tenancy + `@OrganizationId()`) and a console (`gl-console-patterns`).
- An auth layer that gives each request an `organizationId` and fires a hook on org creation.
- Ask the user: which **payment provider** (Graphland PGW is the shipped adapter; Stripe/Paddle need a new adapter), the **plan tiers + prices**, the **numeric limits and feature flags** their product needs, and the **trial length**.

## 1. Shared package

Copy `gl-billing-patterns/templates/plans/` → `packages/plans/`. Add it to the root `package.json` workspaces (already `packages/*`). Edit `src/catalog.ts` and `src/types.ts` to the project's real tiers, limits (rename `maxItems`/`maxRequestsPerPeriod`/`maxSeats` to the domain), and feature keys. Reference it as `@app/plans` (`"@app/plans": "workspace:*"`) from both apps.

## 2. API billing module

Copy `gl-billing-patterns/templates/api/` → `apps/api/src/api/billing/`. Then:

- Register `BillingModule` in `AppModule`; add `ScheduleModule.forRoot()` (for crons) and ensure `NestFactory.create(AppModule, { rawBody: true })` (for webhook signature verification).
- Bind the gateway: keep `{ provide: PAYMENT_GATEWAY, useClass: PgwGateway }` for PGW, or write a sibling adapter implementing `PaymentGateway` and bind that.
- Provide `USAGE_PROVIDER` with a service implementing `countItems(orgId)` against the resource the plan limits (projects, connections, …).
- Seed a trial on org creation: call `SubscriptionService.seedTrialForOrganization(orgId)` from your auth org-create hook.
- Add the billing env vars to the Joi schema; purge billing collections in the org-delete hook.
- Implement `OrganizationSeatService.getSeatUsage` against your auth members/invitations.

## 3. Apply the gates

At each real gate point, inject `EntitlementService` and call the right method (see `references/enforcement.md`): `assertFeature` for boolean features, `assertCanUse` + `recordUsage` for metered actions, `assertCanCreateItem` for resource caps. Use `@RequiresFeature()` only for simple endpoint-level feature gates.

## 4. Console gates

Copy `gl-billing-patterns/templates/console/` into the console (`hooks/`, `lib/billing.ts`, `components/`). Point `lib/billing.ts`'s `apiRequest` and `use-entitlements`'s active-org hook at the project's equivalents. Load `useEntitlements` once in the merchant layout; render `<BillingBanner />`; gate actions with `<FeatureGateButton>` / `<PlanFeatureGate>`. Build the `/billing` page (current plan, usage vs limits, term picker, checkout, invoice history).

## 5. Verify

1. `tsc --noEmit` in `packages/plans`, `apps/api`, and the console.
2. Boot the API: `/docs` shows the billing endpoints; `GET /v1/billing/entitlements` returns the trial profile for a fresh org.
3. Exercise a gate (e.g. hit a feature endpoint on the free plan → 403 `FEATURE_NOT_AVAILABLE`).
4. Write `docs/BILLING.md` for the project (model the waland docs referenced in `references/waland-example.md`).
