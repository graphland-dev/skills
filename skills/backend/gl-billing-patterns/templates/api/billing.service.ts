import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  computeCheckoutAmount,
  type BillingTermMonths,
  type PaidPlanSlug,
} from '@app/plans';
import {
  BillingInvoicePurpose,
  BillingInvoiceStatus,
  SubscriptionStatus,
} from './billing.contracts';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepositoryService } from './subscription.repository.service';
import { BillingInvoiceRepositoryService } from './billing-invoice.repository.service';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from './gateway/payment-gateway.interface';
import type { SubscriptionDocument } from './entities/subscription.entity';

/**
 * Orchestrates checkout, the webhook source-of-truth handlers, and the
 * lifecycle transitions the scheduler drives. This is the project-specific
 * glue — adjust customer info, URLs, currency, and emails to your app.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionRepository: SubscriptionRepositoryService,
    private readonly invoiceRepository: BillingInvoiceRepositoryService,
    private readonly configService: ConfigService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  /** POST /v1/billing/checkout → create a gateway invoice, return its URL. */
  async createCheckout(
    organizationId: string,
    planSlug: PaidPlanSlug,
    termMonths: BillingTermMonths,
    customer: { id: string; email?: string; name?: string },
  ): Promise<{ paymentUrl: string; gatewayInvoiceId: string }> {
    const subscription =
      await this.subscriptionService.ensureSubscription(organizationId);
    const { baseMonthlyAmount, discountPercent, amount } =
      computeCheckoutAmount(planSlug, termMonths);
    const currency = this.configService.get<string>('billing.currency', 'USD');

    const contextDate = (
      subscription.currentPeriodEnd ??
      subscription.trialEndsAt ??
      new Date()
    )
      .toISOString()
      .slice(0, 10);
    const identifier = `sub:${organizationId}:activate:${termMonths}m:${contextDate}`;

    const existing = await this.invoiceRepository.findByIdentifier(identifier);
    if (existing && existing.status === BillingInvoiceStatus.PENDING) {
      const status = await this.gateway.getInvoiceStatus(
        existing.gatewayInvoiceId,
      );
      if (status === 'pending') {
        // Reuse the in-flight invoice (idempotency).
        const url = this.checkoutUrls(organizationId);
        const recreated = await this.gateway.createInvoice({
          identifier,
          amount: existing.amount ?? amount,
          currency,
          customer,
          ...url,
          metadata: { planSlug, termMonths: String(termMonths) },
        });
        return {
          paymentUrl: recreated.paymentUrl,
          gatewayInvoiceId: recreated.gatewayInvoiceId,
        };
      }
    }

    const created = await this.gateway.createInvoice({
      identifier,
      amount,
      currency,
      customer,
      ...this.checkoutUrls(organizationId),
      metadata: { planSlug, termMonths: String(termMonths) },
    });

    await this.invoiceRepository.create({
      organizationId,
      subscriptionId: subscription._id,
      gatewayInvoiceId: created.gatewayInvoiceId,
      identifier,
      planSlug,
      termMonths,
      discountPercent,
      baseMonthlyAmount,
      amount,
      currency,
      status: BillingInvoiceStatus.PENDING,
      purpose: subscription.currentPeriodEnd
        ? BillingInvoicePurpose.RENEWAL
        : BillingInvoicePurpose.INITIAL,
      paidAt: null,
      supersededBy: null,
    });

    return {
      paymentUrl: created.paymentUrl,
      gatewayInvoiceId: created.gatewayInvoiceId,
    };
  }

  /** Webhook: activate the subscription and extend the paid-through date. */
  async handlePaymentPaid(input: {
    gatewayInvoiceId: string;
    identifier: string;
    metadata?: Record<string, string | undefined>;
  }): Promise<void> {
    const invoice = await this.invoiceRepository.findByIdentifier(
      input.identifier,
    );
    if (!invoice) {
      this.logger.warn(`Paid webhook for unknown invoice ${input.identifier}`);
      return;
    }
    if (invoice.status === BillingInvoiceStatus.PAID) {
      return; // already processed
    }

    const termMonths =
      Number(input.metadata?.termMonths ?? invoice.termMonths) || 1;
    const subscription = await this.subscriptionService.ensureSubscription(
      invoice.organizationId,
    );

    const now = new Date();
    const base =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
        ? new Date(subscription.currentPeriodEnd)
        : now;
    const currentPeriodEnd = new Date(base);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + termMonths);

    await this.subscriptionService.updateByOrganizationId(
      invoice.organizationId,
      {
        status: SubscriptionStatus.ACTIVE,
        planSlug: invoice.planSlug,
        trialEndsAt: null,
        currentPeriodStart: now,
        currentPeriodEnd,
      },
    );
    await this.invoiceRepository.updateById(invoice._id.toString(), {
      status: BillingInvoiceStatus.PAID,
      paidAt: now,
    });
  }

  /** Webhook: a renewal payment failed → flag past due. */
  async handlePaymentFailed(input: {
    gatewayInvoiceId: string;
    identifier: string;
  }): Promise<void> {
    const invoice = await this.invoiceRepository.findByIdentifier(
      input.identifier,
    );
    if (!invoice) {
      return;
    }
    await this.invoiceRepository.updateById(invoice._id.toString(), {
      status: BillingInvoiceStatus.FAILED,
    });
    if (invoice.purpose === BillingInvoicePurpose.RENEWAL) {
      await this.subscriptionService.updateByOrganizationId(
        invoice.organizationId,
        { status: SubscriptionStatus.PAST_DUE },
      );
    }
  }

  // ---- Lifecycle transitions invoked by the scheduler ----

  async expireTrial(subscription: SubscriptionDocument): Promise<void> {
    await this.subscriptionRepository.updateById(subscription._id.toString(), {
      status: SubscriptionStatus.AWAITING_PAYMENT,
    });
    await this.createDefaultInvoice(
      subscription,
      BillingInvoicePurpose.INITIAL,
    );
    // TODO: email the org owner.
  }

  async markAwaitingPayment(
    subscription: SubscriptionDocument,
  ): Promise<void> {
    await this.subscriptionRepository.updateById(subscription._id.toString(), {
      status: SubscriptionStatus.AWAITING_PAYMENT,
    });
  }

  async markPastDue(subscription: SubscriptionDocument): Promise<void> {
    await this.subscriptionRepository.updateById(subscription._id.toString(), {
      status: SubscriptionStatus.PAST_DUE,
    });
  }

  async markExpired(subscription: SubscriptionDocument): Promise<void> {
    await this.subscriptionRepository.updateById(subscription._id.toString(), {
      status: SubscriptionStatus.EXPIRED,
    });
  }

  async createDefaultInvoice(
    subscription: SubscriptionDocument,
    purpose: BillingInvoicePurpose,
  ): Promise<void> {
    // Default 1-month invoice; the user can pick a longer term at checkout.
    const planSlug = subscription.planSlug;
    const { baseMonthlyAmount, discountPercent, amount } =
      computeCheckoutAmount(planSlug, 1);
    const contextDate = (subscription.currentPeriodEnd ?? new Date())
      .toISOString()
      .slice(0, 10);
    const identifier = `sub:${subscription.organizationId}:activate:1m:${contextDate}`;

    if (await this.invoiceRepository.findByIdentifier(identifier)) {
      return; // idempotent
    }

    const currency = this.configService.get<string>('billing.currency', 'USD');
    const created = await this.gateway.createInvoice({
      identifier,
      amount,
      currency,
      customer: { id: subscription.organizationId },
      ...this.checkoutUrls(subscription.organizationId),
      metadata: { planSlug, termMonths: '1' },
    });

    await this.invoiceRepository.create({
      organizationId: subscription.organizationId,
      subscriptionId: subscription._id,
      gatewayInvoiceId: created.gatewayInvoiceId,
      identifier,
      planSlug,
      termMonths: 1,
      discountPercent,
      baseMonthlyAmount,
      amount,
      currency,
      status: BillingInvoiceStatus.PENDING,
      purpose,
      paidAt: null,
      supersededBy: null,
    });
  }

  private checkoutUrls(organizationId: string): {
    successUrl: string;
    cancelUrl: string;
    failUrl: string;
  } {
    const base = this.configService.get<string>(
      'billing.consoleUrl',
      'http://localhost:5173',
    );
    const billing = `${base}/billing?org=${organizationId}`;
    return {
      successUrl: `${billing}&status=success`,
      cancelUrl: `${billing}&status=cancel`,
      failUrl: `${billing}&status=fail`,
    };
  }
}
