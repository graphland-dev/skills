# Shared `@app/plans` package — the keystone

## Why a shared package

The plan catalog and the pure functions that resolve/check entitlements live in **one workspace package imported by both the API and the frontend**. The API uses it to *enforce*; the console uses it to *show lock icons*. Because both import the same `resolveEffectiveEntitlements` / `hasBillingFeature`, the UI's idea of "locked" can never disagree with the server's. This is the single most important decision in the whole system — do not duplicate plan logic per app.

It's plain TypeScript source (no build step). The API compiles it as part of `nest build`; the frontend bundles it via Vite. Both reference it as `@app/plans` (a `workspace:*` dependency).

## Layout (`templates/plans/`)

```
packages/plans/
├── package.json          # { "name": "@app/plans", "exports": { ".": "./src/index.ts" } }
└── src/
    ├── types.ts          # PlanLimits, PlanFeatures, SubscriptionStatus, OrgEntitlements, …
    ├── catalog.ts        # PLAN_CATALOG + merge/blocked/discount/checkout-amount helpers
    ├── resolve.ts        # resolveEffectiveEntitlements, getPeriodKey, isBlockedSubscriptionStatus
    ├── checks.ts         # canUseService, isItemLimitExceeded, isRequestQuotaExceeded, seat checks
    ├── messages.ts       # lock-message + label helpers (upgrade prompts)
    └── index.ts          # re-exports everything
```

## The catalog is the source of truth

`PLAN_CATALOG: Record<PlanSlug, PlanEntitlements>` defines every tier's `limits` (numeric, `null` = unlimited) and `features` (boolean). **Marketing copy on the landing page is display-only — never parse it at runtime.** Editing a price or limit here changes enforcement everywhere.

```ts
type PlanLimits = {
  maxItems: number | null;          // resource caps; rename to your domain
  maxSeats: number | null;
  maxRequestsPerPeriod: number | null;
  maxRequestsPerMinute: number;
};
type PlanFeatures = {                // boolean gates; add a key + wire assertFeature
  advancedReports: boolean;
  apiAccess: boolean;
  webhooks: boolean;
};
```

## Resolution

`resolveEffectiveEntitlements(subscription)` → `{ limits, features }`:
1. Blocked status → `getBlockedLimits()` / `getBlockedFeatures()` (zeros / all-false).
2. Trialing → the `trial` catalog entry.
3. Active → the subscription's `planSlug` entry.
4. Enterprise `customLimits`/`customFeatures` merge on top (`mergePlanLimits`/`mergePlanFeatures`).

## Adapting it to your product

Rename the limit keys (`maxItems` → `maxProjects`, etc.) and the feature keys to your real features, set real prices, and add/remove tiers. Keep: the `null = unlimited` convention, the blocked-zeroing, `getPeriodKey`, and the `OrgEntitlements` response shape (the frontend depends on it). Every `assertFeature` key must exist in `PlanFeatures` — add the key to the catalog *before* shipping UI that references it.
