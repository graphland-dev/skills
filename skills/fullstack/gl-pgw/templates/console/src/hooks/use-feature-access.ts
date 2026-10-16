import type {
  BillingBootstrapEntitlement,
  BillingFeatureType,
} from "@graphland/pgw-merchant";
import {
  useEntitlements as usePgwEntitlements,
  usePgWContext,
} from "@graphland/pgw-merchant/react";

/**
 * What the UI does with a key the bootstrap doesn't contain. The PGW server
 * rejects unknown keys, so "closed" keeps UI and API in agreement. Switch to
 * "open" only during a staged catalog rollout, and switch back afterwards.
 */
const MISSING_FEATURE_POLICY: "closed" | "open" = "closed";

export type FeatureAccessState =
  | "loading"
  | "error"
  | "allowed"
  | "denied"
  | "missing";

export type FeatureAccess = {
  allowed: boolean;
  state: FeatureAccessState;
  featureType: BillingFeatureType | null;
  loading: boolean;
  error: Error | null;
};

export function normalizeFeatureKey(featureKey: string): string {
  return featureKey.trim().toLowerCase();
}

export function getEntitlementByFeatureKey(
  entitlements: Record<string, BillingBootstrapEntitlement>,
  featureKey: string,
): BillingBootstrapEntitlement | null {
  const normalized = normalizeFeatureKey(featureKey);
  if (entitlements[normalized]) return entitlements[normalized];
  for (const [key, entitlement] of Object.entries(entitlements)) {
    if (normalizeFeatureKey(key) === normalized) return entitlement;
  }
  return null;
}

/** Reads the bootstrap snapshot; never fetches per feature. */
export function useFeatureAccess(featureKey: string): FeatureAccess {
  const { data, status, error } = usePgWContext();

  if (status === "idle" || status === "loading") {
    return { allowed: false, state: "loading", featureType: null, loading: true, error: null };
  }
  if (error) {
    return { allowed: false, state: "error", featureType: null, loading: false, error };
  }

  const entitlement = getEntitlementByFeatureKey(
    data?.entitlements ?? {},
    featureKey,
  );
  if (!entitlement) {
    return { allowed: false, state: "missing", featureType: null, loading: false, error: null };
  }

  return {
    allowed: entitlement.allowed,
    state: entitlement.allowed ? "allowed" : "denied",
    featureType: entitlement.type,
    loading: false,
    error: null,
  };
}

/** The single place the missing-key policy is applied. */
export function isFeatureOpen(access: FeatureAccess): boolean {
  if (access.loading) return false;
  if (access.state === "missing") return MISSING_FEATURE_POLICY === "open";
  return access.allowed;
}

/** Nav/route lock state. Only boolean features lock surfaces; quotas never do. */
export function usePlanFeatureState(featureKey?: string) {
  const access = useFeatureAccess(featureKey ?? "");
  if (!featureKey) return { locked: false, loading: false };

  const lockable =
    access.featureType === "boolean" ||
    (access.state === "missing" && MISSING_FEATURE_POLICY === "closed");
  return {
    locked: lockable && !access.loading && !isFeatureOpen(access),
    loading: access.loading,
  };
}

/** Snapshot helpers for create buttons and conditional UI. */
export function useEntitlements() {
  const context = usePgWContext();
  const entitlements = usePgwEntitlements();

  const hasFeature = (key: string): boolean => {
    const entitlement = getEntitlementByFeatureKey(entitlements, key);
    if (!entitlement) return MISSING_FEATURE_POLICY === "open";
    if (!entitlement.allowed) return false;
    if (entitlement.type === "boolean") return true;
    const remaining = entitlement.remaining;
    return remaining == null || remaining === -1 || remaining > 0;
  };

  return {
    entitlements,
    planKey: context.data?.subscription?.planKey,
    hasFeature,
    isLoading: context.loading,
    error: context.error,
    refresh: context.refresh,
  };
}
