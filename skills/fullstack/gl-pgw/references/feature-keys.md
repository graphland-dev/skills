# Shared feature keys and the gate catalog

## Why a shared module

PGW feature keys are plain strings like `"coupons"`, `"products_count"`, or `"blogscms"`. The server guard, the services, the nav config, and the page gates all reference them. If you inline them:

- A typo compiles fine and then fails silently: the UI unlocks (missing key) while the server rejects with `NOT_FOUND`, or the reverse.
- Server and client drift when someone renames one side.

So put them in **one pure-TypeScript package** that both server and client import. It must have no framework dependencies. The frontend usually can't import the backend's shared package, because that pulls in Nest or Mongoose.

**It holds key names and gate wiring only.** Plans, prices, limits, and which plan includes what all stay in PGW and are read at runtime.

## Shape

```ts
// packages/feature-keys/src/features.ts
/** Exact PGW feature keys for client `<clientId>`. Never rename a value. */
export const APP_PGW_FEATURES = {
  coupons: "coupons",             // boolean
  products: "products_count",     // non_consumable
  orders: "orders_counts",        // consumable
} as const;
export type AppPgwFeatureKey =
  (typeof APP_PGW_FEATURES)[keyof typeof APP_PGW_FEATURES];
```

```ts
// packages/feature-keys/src/feature-gates.ts
/** Operation name → required boolean feature. Read by the server guard. */
export const featureGateCatalog = {
  coupons: {
    mutations: {
      createCoupon: APP_PGW_FEATURES.coupons,
      updateCoupon: APP_PGW_FEATURES.coupons,
    },
  },
} as const satisfies Record<
  string,
  {
    queries?: Record<string, AppPgwFeatureKey>;
    mutations: Record<string, AppPgwFeatureKey>;
  }
>;

export function getRequiredFeature(op: string): AppPgwFeatureKey | undefined {
  // Flatten modules into one map; operation names must be globally unique.
}
```

Rules:

- **Values must equal the PGW key exactly.** Add a constant only after the key is published in PGW for your `clientId`.
- **Only boolean features go in `featureGateCatalog`.** Quotas are enforced in services with the current count. A guard can't know the count, and `getEntitlement().allowed` stays true while quota remains.
- Mirror the shape of your RBAC catalog if you have one, so plan gates and permission gates are managed the same way.
- Name the package for what it holds (for example `feature-keys` or `entitlements`), not `plans`. That avoids "we don't keep plans locally" confusion.

## Template

`templates/feature-keys/` is the complete package (`package.json` with
`exports` pointing at `src/`, so no build step). In a Bun workspace:

1. Copy it to `packages/feature-keys/` and rename `@app/feature-keys` to the project scope.
2. Add `"@app/feature-keys": "workspace:*"` to the API and console `package.json`, then `bun install`.
3. If the API compiles with `tsc`/Nest CLI rather than Bun, add a `paths` entry (`"@app/feature-keys": ["../../packages/feature-keys/src"]`) so the TS sources resolve.

The API imports it in the guard, `@RequireFeature`, and quota services; the
console imports it in nav config, `FeatureGate`, and usage bars.
