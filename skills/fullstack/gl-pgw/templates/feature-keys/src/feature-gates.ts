import { APP_PGW_FEATURES, type AppPgwFeatureKey } from "./features";

/**
 * Operation name (GraphQL field name) → boolean PGW feature it requires.
 *
 * Read by the API's global `FeatureEntitlementGuard`, so gating an operation
 * is a one-line edit here — no per-resolver decorators. Only boolean features
 * belong here: quotas need the current count, which only the service knows.
 * Operation names must be globally unique across modules.
 */
export interface FeatureGateModuleConfig {
  queries?: Record<string, AppPgwFeatureKey>;
  mutations: Record<string, AppPgwFeatureKey>;
}

export type FeatureGateCatalogDocument = Record<
  string,
  FeatureGateModuleConfig
>;

export const featureGateCatalog = {
  coupons: {
    mutations: {
      sales__createCoupon: APP_PGW_FEATURES.coupons,
      sales__updateCoupon: APP_PGW_FEATURES.coupons,
      sales__removeCoupon: APP_PGW_FEATURES.coupons,
    },
  },
  domains: {
    mutations: {
      settings__createCustomDomain: APP_PGW_FEATURES.customDomain,
    },
  },
  reports: {
    queries: {
      reports__salesSummary: APP_PGW_FEATURES.reports,
    },
    mutations: {},
  },
} as const satisfies FeatureGateCatalogDocument;

export function flattenFeatureGateCatalog(
  catalog: FeatureGateCatalogDocument = featureGateCatalog,
): Map<string, AppPgwFeatureKey> {
  const gates = new Map<string, AppPgwFeatureKey>();
  for (const moduleConfig of Object.values(catalog)) {
    for (const [field, feature] of Object.entries(moduleConfig.queries ?? {})) {
      gates.set(field, feature);
    }
    for (const [field, feature] of Object.entries(moduleConfig.mutations)) {
      gates.set(field, feature);
    }
  }
  return gates;
}

const gates = flattenFeatureGateCatalog();

/** Feature key required by an operation, if the catalog gates it. */
export function getRequiredFeature(
  fieldName: string | undefined,
): AppPgwFeatureKey | undefined {
  return fieldName ? gates.get(fieldName) : undefined;
}
