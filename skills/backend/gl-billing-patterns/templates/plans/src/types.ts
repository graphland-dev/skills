// Shared plan/entitlement contract — imported by BOTH the API (enforcement)
// and the frontend (read-only UX gates) so they can never disagree.

export type PlanSlug = 'trial' | 'free' | 'pro' | 'enterprise';

/** Paid tiers a subscription document can carry (trial is a status, not a plan). */
export type PaidPlanSlug = 'free' | 'pro' | 'enterprise';

export type BillingTermMonths = 1 | 6 | 12;

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'awaiting_payment'
  | 'past_due'
  | 'expired';

/**
 * Numeric caps. `null` means unlimited. Rename/extend these to your domain
 * (e.g. maxConnections, maxProjects) — keep the `null = unlimited` convention.
 */
export type PlanLimits = {
  maxItems: number | null;
  maxSeats: number | null;
  maxRequestsPerPeriod: number | null;
  maxRequestsPerMinute: number;
};

/** Boolean feature gates. Add a key here AND wire assertFeature before shipping UI. */
export type PlanFeatures = {
  advancedReports: boolean;
  apiAccess: boolean;
  webhooks: boolean;
};

export type BillingFeatureKey = keyof PlanFeatures;

export type PlanEntitlements = {
  slug: PlanSlug;
  displayName: string;
  monthlyPrice: number | null;
  limits: PlanLimits;
  features: PlanFeatures;
};

export type TermDiscount = {
  termMonths: BillingTermMonths;
  discountPercent: number;
};

export type OrgEntitlementsUsage = {
  itemsUsed: number;
  seatsUsed: number;
  requestsUsed: number;
  pendingInvitesUsed: number;
  periodKey: string;
};

/** Runtime entitlements returned by GET /v1/billing/entitlements. */
export type OrgEntitlements = {
  status: SubscriptionStatus;
  planSlug: PaidPlanSlug;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  limits: PlanLimits;
  usage: OrgEntitlementsUsage;
  features: PlanFeatures;
};

/** Subscription fields needed to resolve catalog limits/features. */
export type SubscriptionForEntitlements = {
  organizationId: string;
  status: SubscriptionStatus;
  planSlug: PaidPlanSlug;
  customLimits?: Partial<PlanLimits> | null;
  customFeatures?: Partial<PlanFeatures> | null;
};

export type ResolvedEntitlements = {
  limits: PlanLimits;
  features: PlanFeatures;
};
