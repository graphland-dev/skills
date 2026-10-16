import {
  GraphlandPGWClient,
  type BillingCatalog,
  type CatalogEntitlement,
  type CatalogFeature,
  type CatalogPlan,
  type PlanPriceVariant,
} from "@graphland/pgw-merchant";
import { usePgWContext } from "@graphland/pgw-merchant/react";

import { env } from "@/lib/env";

/** Catalog already loaded by the PgWProvider bootstrap — no extra request. */
export function usePgwCatalog() {
  const { data, loading, error } = usePgWContext();
  return {
    data: data?.catalog ?? null,
    isLoading: loading,
    isError: Boolean(error),
    error,
  };
}

let publicCatalogPromise: Promise<BillingCatalog> | null = null;

/**
 * Published catalog without a billing customer (signup, onboarding, pricing
 * pages). Uses the public key only.
 */
export function fetchPublishedBillingCatalog(): Promise<BillingCatalog> {
  if (!publicCatalogPromise) {
    const client = new GraphlandPGWClient({
      apiKey: env.VITE_PGW_PUBLIC_API_KEY,
      clientId: env.VITE_PGW_CLIENT_ID,
      baseUrl: env.VITE_PGW_BASE_URL || undefined,
    });
    publicCatalogPromise = client.getCatalog().catch((error) => {
      publicCatalogPromise = null;
      throw error;
    });
  }
  return publicCatalogPromise;
}

export function formatCatalogName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getCatalogFeatureLabel(
  feature: { key: string; label?: string } | undefined,
): string {
  const label = feature?.label?.trim();
  return label || (feature ? formatCatalogName(feature.key) : "—");
}

export function getCatalogEntitlementLabel(
  entitlement: CatalogEntitlement,
): string {
  return (
    entitlement.featureLabel?.trim() ||
    formatCatalogName(entitlement.featureKey)
  );
}

/** Numeric limit, or `null` when unlimited (PGW reports unlimited as `-1`). */
export function getCatalogEntitlementLimit(
  entitlement:
    | { consumed?: number; remaining?: number; effectiveLimit?: number }
    | undefined,
): number | null {
  if (!entitlement) return null;
  const rawLimit =
    entitlement.effectiveLimit ??
    (entitlement.remaining != null
      ? (entitlement.consumed ?? 0) + entitlement.remaining
      : null);
  return rawLimit != null && rawLimit >= 0 ? rawLimit : null;
}

export function getCatalogVariant(
  plan: CatalogPlan,
  billingCycleDays: number,
): PlanPriceVariant | undefined {
  return plan.priceVariants.find(
    (variant) => variant.billingCycleDays === billingCycleDays,
  );
}

export function getCatalogCycleLabel(billingCycleDays: number): string {
  if (billingCycleDays % 365 === 0) {
    const years = billingCycleDays / 365;
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  if (billingCycleDays % 30 === 0) {
    const months = billingCycleDays / 30;
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return `${billingCycleDays} days`;
}

export function formatCatalogAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function getPlanEntitlement(
  plan: CatalogPlan,
  featureKey: string,
): CatalogEntitlement | undefined {
  return plan.entitlements.find(
    (entitlement) => entitlement.featureKey === featureKey,
  );
}

export function getPlanUsageFeatures(
  features: CatalogFeature[],
  plan: CatalogPlan,
): CatalogFeature[] {
  return features.filter(
    (feature) =>
      feature.type !== "boolean" &&
      Boolean(getPlanEntitlement(plan, feature.key)),
  );
}

/** Savings of a longer cycle versus the plan's shortest cycle, pro-rated by days. */
export function getVariantSavings(
  plan: CatalogPlan,
  variant: PlanPriceVariant,
): { regularPrice: number; savedAmount: number; discountPercentage: number } | null {
  if (plan.priceVariants.length === 0) return null;
  const baseVariant = plan.priceVariants.reduce((shortest, candidate) =>
    candidate.billingCycleDays < shortest.billingCycleDays
      ? candidate
      : shortest,
  );
  const regularPrice = Math.round(
    (baseVariant.price / baseVariant.billingCycleDays) *
      variant.billingCycleDays,
  );
  if (regularPrice <= 0 || variant.price >= regularPrice) return null;

  const savedAmount = regularPrice - variant.price;
  return {
    regularPrice,
    savedAmount,
    discountPercentage: Math.round((savedAmount / regularPrice) * 100),
  };
}
