/**
 * Exact PGW feature keys for this app's `clientId`.
 *
 * Values must match the keys published in PGW byte-for-byte. Never rename a
 * value; add a new key in PGW and migrate instead. Plans, prices, and limits
 * stay in PGW and are read at runtime — this file only names the keys.
 */
export const APP_PGW_FEATURES = {
  // boolean — whole areas, enforced by FeatureEntitlementGuard via the gate catalog
  coupons: "coupons",
  customDomain: "custom_domain",
  reports: "reports",

  // non_consumable — "max N existing", enforced in services with currentQuantity
  staff: "staff_counts",
  products: "products_count",

  // consumable — metered per period, enforced in services with a requestId
  orders: "orders_counts",
} as const;

export type AppPgwFeatureKey =
  (typeof APP_PGW_FEATURES)[keyof typeof APP_PGW_FEATURES];
