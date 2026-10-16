import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_GATEWAY,
  type CheckoutSessionResult,
  type PaymentGateway,
} from '@graphland/pgw-merchant/nest';
import { ApiError } from '@graphland/pgw-merchant';
import {
  CreatePgwCheckoutInput,
  PayPgwInvoiceInput,
  PgwCheckoutSessionResponseDto,
} from './pgw-billing.dto';

type CheckoutOutcome = 'success' | 'cancelled' | 'failed';

export interface CheckoutCustomer {
  name?: string;
  email?: string;
}

/**
 * Secure boundary between the browser and PGW's private-key operations.
 * PGW owns prices, subscriptions, invoices, trials, and plan changes — this
 * service only validates the selection and returns the hosted checkout URL.
 */
@Injectable()
export class PgwCheckoutService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly config: ConfigService,
  ) {}

  async createCheckout(
    tenant: string,
    input: CreatePgwCheckoutInput,
    customer: CheckoutCustomer,
  ): Promise<PgwCheckoutSessionResponseDto> {
    const catalog = await this.gateway.getCatalog();
    const plan = catalog.plans.find((p) => p.planKey === input.planKey);
    const variant = plan?.priceVariants.find(
      (v) => v.variantKey === input.variantKey,
    );
    if (!plan || !variant) {
      throw new BadRequestException(
        `Plan '${input.planKey}' has no published price variant '${input.variantKey}'`,
      );
    }

    return this.run(() =>
      this.gateway.createCheckoutSession({
        organizationId: tenant,
        planKey: plan.planKey,
        priceVariantKey: variant.variantKey,
        customerName: customer.name,
        customerEmail: customer.email,
        ...this.returnUrls(tenant),
      }),
    );
  }

  async payInvoice(
    tenant: string,
    input: PayPgwInvoiceInput,
  ): Promise<PgwCheckoutSessionResponseDto> {
    return this.run(() =>
      this.gateway.payInvoice({
        invoiceNumber: input.invoiceNumber,
        ...this.returnUrls(tenant),
      }),
    );
  }

  private returnUrls(tenant: string) {
    const origin = this.config
      .getOrThrow<string>('WEB_CONSOLE_URL')
      .replace(/\/+$/, '');
    const url = (outcome: CheckoutOutcome) =>
      `${origin}/merchant/${encodeURIComponent(tenant)}/billing?checkout=${outcome}`;
    return {
      successUrl: url('success'),
      cancelUrl: url('cancelled'),
      failUrl: url('failed'),
    };
  }

  private async run(
    call: () => Promise<CheckoutSessionResult>,
  ): Promise<PgwCheckoutSessionResponseDto> {
    try {
      const session = await call();
      return {
        sessionId: session.sessionId,
        redirectUrl: session.redirectUrl || null,
        invoiceId: session.invoiceId,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
