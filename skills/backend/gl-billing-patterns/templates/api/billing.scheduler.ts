import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { SubscriptionRepositoryService } from './subscription.repository.service';
import {
  BillingInvoicePurpose,
  SubscriptionStatus,
} from './billing.contracts';

/**
 * Drives the time-based lifecycle. Each job guards against overlap and swallows
 * errors so one bad org never blocks the batch. Requires ScheduleModule.forRoot()
 * in AppModule.
 */
@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);
  private trialExpiryRunning = false;
  private renewalRunning = false;
  private pastDueRunning = false;

  constructor(
    private readonly subscriptionRepository: SubscriptionRepositoryService,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleTrialExpiry(): Promise<void> {
    if (this.trialExpiryRunning) return;
    this.trialExpiryRunning = true;
    try {
      const expired = await this.subscriptionRepository.findTrialsExpiredBefore(
        new Date(),
      );
      for (const subscription of expired) {
        if (subscription.status !== SubscriptionStatus.TRIALING) continue;
        await this.billingService.expireTrial(subscription);
      }
    } catch (error) {
      this.logger.error(`Trial expiry cron failed: ${String(error)}`);
    } finally {
      this.trialExpiryRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRenewalReminder(): Promise<void> {
    if (this.renewalRunning) return;
    this.renewalRunning = true;
    try {
      const candidates =
        await this.subscriptionRepository.findActiveRenewalCandidates(30);
      for (const subscription of candidates) {
        if (subscription.cancelAtPeriodEnd) continue;
        await this.billingService.createDefaultInvoice(
          subscription,
          BillingInvoicePurpose.RENEWAL,
        );
      }
    } catch (error) {
      this.logger.error(`Renewal reminder cron failed: ${String(error)}`);
    } finally {
      this.renewalRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handlePastDueAndExpiry(): Promise<void> {
    if (this.pastDueRunning) return;
    this.pastDueRunning = true;
    try {
      const now = new Date();

      for (const subscription of await this.subscriptionRepository.findActiveEndingBefore(
        now,
      )) {
        await this.billingService.markAwaitingPayment(subscription);
      }

      for (const subscription of await this.subscriptionRepository.findByStatusEndingBefore(
        SubscriptionStatus.AWAITING_PAYMENT,
        now,
      )) {
        await this.billingService.markPastDue(subscription);
      }

      const graceDays = this.configService.get<number>(
        'billing.gracePeriodDays',
        7,
      );
      const graceCutoff = new Date(now);
      graceCutoff.setDate(graceCutoff.getDate() - graceDays);

      for (const subscription of await this.subscriptionRepository.findPastDueExpiredGrace(
        graceCutoff,
      )) {
        await this.billingService.markExpired(subscription);
      }
    } catch (error) {
      this.logger.error(`Past-due cron failed: ${String(error)}`);
    } finally {
      this.pastDueRunning = false;
    }
  }
}
