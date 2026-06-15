import { getFeatureMinPlanSlug, planDisplayName } from './catalog.js';
import { canInviteOrgMember } from './checks.js';
import type {
  BillingFeatureKey,
  OrgEntitlements,
  PaidPlanSlug,
  SubscriptionStatus,
} from './types.js';

export const BILLING_FEATURE_LABELS: Record<BillingFeatureKey, string> = {
  advancedReports: 'Advanced reports',
  apiAccess: 'API access',
  webhooks: 'Webhooks',
};

export const BILLING_FEATURE_KEYS = Object.keys(
  BILLING_FEATURE_LABELS,
) as BillingFeatureKey[];

export function getMemberSeatLimitMessage(maxSeats: number): string {
  return `Member limit reached (${maxSeats}). Upgrade your plan to invite more people.`;
}

export function getMemberLimitMessage(
  entitlements: OrgEntitlements | undefined,
): string | null {
  const maxSeats = entitlements?.limits.maxSeats;
  if (maxSeats == null) {
    return null;
  }
  if (canInviteOrgMember(entitlements)) {
    return null;
  }
  return getMemberSeatLimitMessage(maxSeats);
}

export function statusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'trialing':
      return 'Trial';
    case 'active':
      return 'Active';
    case 'awaiting_payment':
      return 'Payment required';
    case 'past_due':
      return 'Past due';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

export function paidPlanLabel(slug: PaidPlanSlug): string {
  return planDisplayName(slug);
}

/** Upgrade-prompt copy shown next to a locked feature. */
export function getFeatureLockMessage(
  entitlements: OrgEntitlements | undefined,
  feature: BillingFeatureKey,
): string {
  const label = BILLING_FEATURE_LABELS[feature];

  if (!entitlements) {
    return `${label} is unavailable on your current plan.`;
  }

  if (
    entitlements.status === 'awaiting_payment' ||
    entitlements.status === 'past_due' ||
    entitlements.status === 'expired'
  ) {
    return `${label} is paused until billing is restored.`;
  }

  const minPlan = getFeatureMinPlanSlug(feature);
  if (minPlan === 'trial') {
    return `${label} is included on your trial.`;
  }
  return `${label} requires ${planDisplayName(minPlan)} or higher.`;
}
