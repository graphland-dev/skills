import type {
  BillingTermMonths,
  PaidPlanSlug,
  PlanEntitlements,
  PlanSlug,
  TermDiscount,
} from './types.js';

// When a subscription is blocked (unpaid), limits collapse to zero and every
// feature turns off — except one seat so the owner can still see the billing page.
const BLOCKED_LIMITS: PlanEntitlements['limits'] = {
  maxItems: 0,
  maxSeats: 1,
  maxRequestsPerPeriod: 0,
  maxRequestsPerMinute: 0,
};

const BLOCKED_FEATURES: PlanEntitlements['features'] = {
  advancedReports: false,
  apiAccess: false,
  webhooks: false,
};

/**
 * THE catalog. This is the single source of truth for enforcement — marketing
 * copy on the landing page is display-only and must never be parsed at runtime.
 * Edit prices/limits/features here to define your product's plans.
 */
export const PLAN_CATALOG: Record<PlanSlug, PlanEntitlements> = {
  trial: {
    slug: 'trial',
    displayName: 'Trial',
    monthlyPrice: null,
    limits: {
      maxItems: 5,
      maxSeats: 1,
      maxRequestsPerPeriod: 100,
      maxRequestsPerMinute: 5,
    },
    features: {
      advancedReports: false,
      apiAccess: false,
      webhooks: false,
    },
  },
  free: {
    slug: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    limits: {
      maxItems: 10,
      maxSeats: 1,
      maxRequestsPerPeriod: 1_000,
      maxRequestsPerMinute: 10,
    },
    features: {
      advancedReports: false,
      apiAccess: false,
      webhooks: false,
    },
  },
  pro: {
    slug: 'pro',
    displayName: 'Pro',
    monthlyPrice: 2900,
    limits: {
      maxItems: 500,
      maxSeats: 10,
      maxRequestsPerPeriod: 100_000,
      maxRequestsPerMinute: 100,
    },
    features: {
      advancedReports: true,
      apiAccess: true,
      webhooks: true,
    },
  },
  enterprise: {
    slug: 'enterprise',
    displayName: 'Enterprise',
    monthlyPrice: null, // custom
    limits: {
      maxItems: null,
      maxSeats: null,
      maxRequestsPerPeriod: null,
      maxRequestsPerMinute: 500,
    },
    features: {
      advancedReports: true,
      apiAccess: true,
      webhooks: true,
    },
  },
};

export const TERM_DISCOUNTS: TermDiscount[] = [
  { termMonths: 1, discountPercent: 0 },
  { termMonths: 6, discountPercent: 10 },
  { termMonths: 12, discountPercent: 30 },
];

export const DEFAULT_PAID_PLAN: PaidPlanSlug = 'free';

export const BILLING_TERM_MONTHS: BillingTermMonths[] = [1, 6, 12];

export const PLAN_SLUG_ORDER: PlanSlug[] = [
  'trial',
  'free',
  'pro',
  'enterprise',
];

export function getPlanEntitlements(slug: PlanSlug): PlanEntitlements {
  return PLAN_CATALOG[slug];
}

export function getBlockedLimits(): PlanEntitlements['limits'] {
  return { ...BLOCKED_LIMITS };
}

export function getBlockedFeatures(): PlanEntitlements['features'] {
  return { ...BLOCKED_FEATURES };
}

export function mergePlanLimits(
  base: PlanEntitlements['limits'],
  overrides: Partial<PlanEntitlements['limits']> | null | undefined,
): PlanEntitlements['limits'] {
  if (!overrides) {
    return { ...base };
  }

  return {
    maxItems:
      overrides.maxItems !== undefined ? overrides.maxItems : base.maxItems,
    maxSeats:
      overrides.maxSeats !== undefined ? overrides.maxSeats : base.maxSeats,
    maxRequestsPerPeriod:
      overrides.maxRequestsPerPeriod !== undefined
        ? overrides.maxRequestsPerPeriod
        : base.maxRequestsPerPeriod,
    maxRequestsPerMinute:
      overrides.maxRequestsPerMinute !== undefined
        ? overrides.maxRequestsPerMinute
        : base.maxRequestsPerMinute,
  };
}

export function mergePlanFeatures(
  base: PlanEntitlements['features'],
  overrides: Partial<PlanEntitlements['features']> | null | undefined,
): PlanEntitlements['features'] {
  if (!overrides) {
    return { ...base };
  }

  return {
    advancedReports: overrides.advancedReports ?? base.advancedReports,
    apiAccess: overrides.apiAccess ?? base.apiAccess,
    webhooks: overrides.webhooks ?? base.webhooks,
  };
}

export function getTermDiscount(termMonths: BillingTermMonths): number {
  const entry = TERM_DISCOUNTS.find((item) => item.termMonths === termMonths);
  return entry?.discountPercent ?? 0;
}

/** Amounts are in MAJOR currency units (e.g. 2900, not minor units). */
export function computeCheckoutAmount(
  planSlug: PaidPlanSlug,
  termMonths: BillingTermMonths,
): { baseMonthlyAmount: number; discountPercent: number; amount: number } {
  const plan = PLAN_CATALOG[planSlug];
  const baseMonthlyAmount = plan.monthlyPrice;

  if (baseMonthlyAmount == null) {
    throw new Error(`Plan ${planSlug} has no list price`);
  }

  const discountPercent = getTermDiscount(termMonths);
  const amount = Math.round(
    baseMonthlyAmount * termMonths * (1 - discountPercent / 100),
  );

  return { baseMonthlyAmount, discountPercent, amount };
}

export function isPaidPlanSlug(value: string): value is PaidPlanSlug {
  return value === 'free' || value === 'pro' || value === 'enterprise';
}

export function isBillingTermMonths(value: number): value is BillingTermMonths {
  return value === 1 || value === 6 || value === 12;
}

/** Lowest catalog slug that enables a feature (for upgrade messaging). */
export function getFeatureMinPlanSlug(
  feature: keyof PlanEntitlements['features'],
): PlanSlug {
  for (const slug of PLAN_SLUG_ORDER) {
    if (PLAN_CATALOG[slug].features[feature]) {
      return slug;
    }
  }

  return 'enterprise';
}

export function planDisplayName(slug: PlanSlug): string {
  return PLAN_CATALOG[slug].displayName;
}
