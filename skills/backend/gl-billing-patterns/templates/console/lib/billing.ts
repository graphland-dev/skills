import {
  BILLING_FEATURE_KEYS,
  BILLING_FEATURE_LABELS,
  canInviteOrgMember,
  getFeatureLockMessage,
  getMemberLimitMessage,
  hasBillingFeature,
  paidPlanLabel,
  statusLabel,
  type BillingTermMonths,
  type OrgEntitlements,
  type PaidPlanSlug,
} from '@app/plans';
// Your project's fetch wrapper (adds base URL + auth headers).
import { apiRequest } from '@/lib/api-client';

export type {
  BillingFeatureKey,
  BillingTermMonths,
  OrgEntitlements,
  PaidPlanSlug,
  PlanFeatures,
  SubscriptionStatus,
} from '@app/plans';

export {
  BILLING_FEATURE_KEYS,
  BILLING_FEATURE_LABELS,
  canInviteOrgMember,
  getFeatureLockMessage,
  getMemberLimitMessage,
  hasBillingFeature,
  paidPlanLabel as planLabel,
  statusLabel,
};

export const billingQueryKeys = {
  all: ['billing'] as const,
  entitlements: (organizationId?: string | null) =>
    [...billingQueryKeys.all, 'entitlements', organizationId ?? 'none'] as const,
  subscription: (organizationId?: string | null) =>
    [...billingQueryKeys.all, 'subscription', organizationId ?? 'none'] as const,
  invoices: (organizationId?: string | null) =>
    [...billingQueryKeys.all, 'invoices', organizationId ?? 'none'] as const,
};

export function getEntitlements() {
  return apiRequest<OrgEntitlements>('/v1/billing/entitlements');
}

export function createCheckout(input: {
  planSlug: PaidPlanSlug;
  termMonths: BillingTermMonths;
}) {
  return apiRequest<{ paymentUrl: string; gatewayInvoiceId: string }>(
    '/v1/billing/checkout',
    { method: 'POST', body: input },
  );
}

export function updateSubscription(input: { cancelAtPeriodEnd: boolean }) {
  return apiRequest('/v1/billing/subscription', {
    method: 'PATCH',
    body: input,
  });
}
