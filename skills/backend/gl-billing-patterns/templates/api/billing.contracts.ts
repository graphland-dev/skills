import type { PlanFeatures } from '@app/plans';

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAST_DUE = 'past_due',
  EXPIRED = 'expired',
}

export enum BillingInvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum BillingInvoicePurpose {
  INITIAL = 'initial',
  RENEWAL = 'renewal',
  UPGRADE = 'upgrade',
}

/** Clients and the console branch on `code`, never on message text. */
export enum BillingErrorCode {
  SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',
  REQUEST_QUOTA_EXCEEDED = 'REQUEST_QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ITEM_LIMIT_EXCEEDED = 'ITEM_LIMIT_EXCEEDED',
  MEMBER_LIMIT_EXCEEDED = 'MEMBER_LIMIT_EXCEEDED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
}

export type BillingFeatureKey = keyof PlanFeatures;
