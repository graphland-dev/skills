import {
  getBlockedFeatures,
  getBlockedLimits,
  getPlanEntitlements,
  mergePlanFeatures,
  mergePlanLimits,
} from './catalog.js';
import type {
  PlanSlug,
  ResolvedEntitlements,
  SubscriptionForEntitlements,
  SubscriptionStatus,
} from './types.js';

/** Statuses where the org has lost access until they pay. */
export function isBlockedSubscriptionStatus(
  status: SubscriptionStatus,
): boolean {
  return (
    status === 'awaiting_payment' ||
    status === 'past_due' ||
    status === 'expired'
  );
}

/** While trialing, the trial profile applies regardless of stored planSlug. */
export function getCatalogSlug(
  subscription: Pick<SubscriptionForEntitlements, 'status' | 'planSlug'>,
): PlanSlug {
  if (subscription.status === 'trialing') {
    return 'trial';
  }
  return subscription.planSlug;
}

/**
 * Usage-counter scope. Trial usage never resets (lifetime cap); active usage
 * resets each calendar month (YYYY-MM); blocked statuses count nothing.
 */
export function getPeriodKey(
  organizationId: string,
  status: SubscriptionStatus,
): string | null {
  if (status === 'trialing') {
    return `trial:${organizationId}`;
  }
  if (status === 'active') {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${now.getUTCFullYear()}-${month}`;
  }
  return null;
}

/**
 * The heart of the system: subscription → effective limits + features.
 * Blocked statuses zero everything out; trialing uses the trial profile;
 * active uses planSlug; enterprise overrides merge on top.
 */
export function resolveEffectiveEntitlements(
  subscription: SubscriptionForEntitlements,
): ResolvedEntitlements {
  if (isBlockedSubscriptionStatus(subscription.status)) {
    return {
      limits: getBlockedLimits(),
      features: getBlockedFeatures(),
    };
  }

  const catalog = getPlanEntitlements(getCatalogSlug(subscription));

  return {
    limits: mergePlanLimits(catalog.limits, subscription.customLimits),
    features: mergePlanFeatures(catalog.features, subscription.customFeatures),
  };
}

export function resolveMaxSeats(
  subscription: SubscriptionForEntitlements | null | undefined,
): number | null {
  if (!subscription) {
    return getPlanEntitlements('trial').limits.maxSeats;
  }
  return resolveEffectiveEntitlements(subscription).limits.maxSeats;
}
