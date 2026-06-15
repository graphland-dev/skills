import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_PAID_PLAN } from '@app/plans';
import { SubscriptionRepositoryService } from './subscription.repository.service';
import { SubscriptionStatus } from './billing.contracts';
import type { SubscriptionDocument } from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepositoryService,
    private readonly configService: ConfigService,
  ) {}

  /** Idempotently returns the org's subscription, seeding a trial if missing. */
  async ensureSubscription(
    organizationId: string,
  ): Promise<SubscriptionDocument> {
    const existing =
      await this.subscriptionRepository.findByOrganizationId(organizationId);
    if (existing) {
      return existing;
    }
    return this.seedTrialForOrganization(organizationId);
  }

  /** Call this from your org-create hook (e.g. Better Auth afterCreateOrganization). */
  async seedTrialForOrganization(
    organizationId: string,
  ): Promise<SubscriptionDocument> {
    const trialDays = this.configService.get<number>('billing.trialDays', 14);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    try {
      return await this.subscriptionRepository.create({
        organizationId,
        planSlug: DEFAULT_PAID_PLAN,
        status: SubscriptionStatus.TRIALING,
        trialEndsAt,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        customLimits: null,
        customFeatures: null,
      });
    } catch {
      // Unique index race — another request seeded it first.
      const existing =
        await this.subscriptionRepository.findByOrganizationId(organizationId);
      if (existing) {
        return existing;
      }
      throw new Error(`Failed to seed subscription for ${organizationId}`);
    }
  }

  async updateByOrganizationId(
    organizationId: string,
    data: Partial<SubscriptionDocument>,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.ensureSubscription(organizationId);
    const updated = await this.subscriptionRepository.updateById(
      subscription._id.toString(),
      data,
    );
    if (!updated) {
      throw new Error(`Subscription for ${organizationId} not found`);
    }
    return updated;
  }
}
