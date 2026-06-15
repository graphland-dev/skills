import { Inject, Injectable } from '@nestjs/common';
import {
  canUseService,
  getBlockedFeatures,
  getBlockedLimits,
  getPeriodKey,
  isItemLimitExceeded,
  isRequestQuotaExceeded,
  resolveEffectiveEntitlements,
  type PlanFeatures,
  type PlanLimits,
} from '@app/plans';
import {
  BillingErrorCode,
  BillingFeatureKey,
  SubscriptionStatus,
} from './billing.contracts';
import { BillingEntitlementException } from './billing.exceptions';
import type { EntitlementsResponseDto } from './dto/billing.dto';
import type { SubscriptionDocument } from './entities/subscription.entity';
import { SubscriptionService } from './subscription.service';
import { UsageCounterRepositoryService } from './usage-counter.repository.service';
import { RateLimitService } from './rate-limit.service';
import { OrganizationSeatService } from './organization-seat.service';

/**
 * Counts org-scoped resources the entitlement checks need (items, seats). The
 * billing module doesn't own these tables, so the project provides a small
 * implementation that queries its own collections.
 */
export interface UsageProvider {
  countItems(organizationId: string): Promise<number>;
}

export const USAGE_PROVIDER = Symbol('USAGE_PROVIDER');

/**
 * Resolves runtime entitlements and enforces them. Feature services call the
 * `assert*` methods imperatively before the gated action; the resolver zeroes
 * out everything when the subscription is blocked.
 */
@Injectable()
export class EntitlementService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly usageCounterRepository: UsageCounterRepositoryService,
    private readonly rateLimitService: RateLimitService,
    private readonly organizationSeatService: OrganizationSeatService,
    @Inject(USAGE_PROVIDER) private readonly usageProvider: UsageProvider,
  ) {}

  async getEntitlements(
    organizationId: string,
  ): Promise<EntitlementsResponseDto> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);
    const resolved = await this.resolveEntitlements(subscription);

    return {
      status: subscription.status,
      planSlug: subscription.planSlug,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      limits: resolved.limits,
      usage: resolved.usage,
      features: resolved.features,
    };
  }

  /** Status + period quota + rate limit, for a metered action. */
  async assertCanUse(organizationId: string): Promise<void> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);

    if (!canUseService(subscription.status)) {
      throw new BillingEntitlementException(
        402,
        BillingErrorCode.SUBSCRIPTION_INACTIVE,
        'Subscription is inactive. Pay to continue.',
      );
    }

    const { limits, usage } = await this.resolveEntitlements(subscription);

    if (isRequestQuotaExceeded(limits, usage.requestsUsed)) {
      throw new BillingEntitlementException(
        402,
        BillingErrorCode.REQUEST_QUOTA_EXCEEDED,
        'Request quota exceeded for the current period',
      );
    }

    await this.rateLimitService.assertRateLimit(
      organizationId,
      limits.maxRequestsPerMinute,
    );
  }

  /** Increment usage after a successful metered action (no-op when blocked). */
  async recordUsage(organizationId: string): Promise<void> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);
    const periodKey = getPeriodKey(organizationId, subscription.status);
    if (!periodKey) {
      return;
    }
    await this.usageCounterRepository.incrementRequestsUsed(
      organizationId,
      periodKey,
    );
  }

  /** Boolean feature gate. */
  async assertFeature(
    organizationId: string,
    feature: BillingFeatureKey,
  ): Promise<void> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);
    const { features } = await this.resolveEntitlements(subscription);

    if (!features[feature]) {
      throw new BillingEntitlementException(
        403,
        BillingErrorCode.FEATURE_NOT_AVAILABLE,
        `Feature '${feature}' is not available on your current plan`,
      );
    }
  }

  /** Resource cap (e.g. before creating an item/project/connection). */
  async assertCanCreateItem(organizationId: string): Promise<void> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);

    if (!canUseService(subscription.status)) {
      throw new BillingEntitlementException(
        402,
        BillingErrorCode.SUBSCRIPTION_INACTIVE,
        'Subscription is inactive.',
      );
    }

    const { limits } = await this.resolveEntitlements(subscription);
    const itemsUsed = await this.usageProvider.countItems(organizationId);

    if (isItemLimitExceeded(limits, itemsUsed)) {
      throw new BillingEntitlementException(
        403,
        BillingErrorCode.ITEM_LIMIT_EXCEEDED,
        `Item limit reached (${limits.maxItems})`,
      );
    }
  }

  private async resolveEntitlements(subscription: SubscriptionDocument): Promise<{
    limits: PlanLimits;
    features: PlanFeatures;
    usage: EntitlementsResponseDto['usage'];
  }> {
    const periodKey =
      getPeriodKey(subscription.organizationId, subscription.status) ??
      `blocked:${subscription.organizationId}`;
    const counter = periodKey.startsWith('blocked:')
      ? null
      : await this.usageCounterRepository.findByOrganizationAndPeriod(
          subscription.organizationId,
          periodKey,
        );
    const itemsUsed = await this.usageProvider.countItems(
      subscription.organizationId,
    );
    const seats = await this.organizationSeatService.getSeatUsage(
      subscription.organizationId,
    );

    const usage = {
      requestsUsed: Number(counter?.requestsUsed ?? 0),
      itemsUsed,
      seatsUsed: seats.seatsUsed,
      pendingInvitesUsed: seats.pendingInvitesUsed,
      periodKey,
    };

    const { limits, features } = resolveEffectiveEntitlements({
      organizationId: subscription.organizationId,
      status: subscription.status,
      planSlug: subscription.planSlug,
      customLimits: subscription.customLimits,
      customFeatures: subscription.customFeatures,
    });

    if (
      subscription.status === SubscriptionStatus.AWAITING_PAYMENT ||
      subscription.status === SubscriptionStatus.PAST_DUE ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      return {
        limits: getBlockedLimits(),
        features: getBlockedFeatures(),
        usage,
      };
    }

    return { limits, features, usage };
  }
}
