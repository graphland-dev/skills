import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from './gateway/payment-gateway.interface';

// Requires the raw body. In main.ts: NestFactory.create(AppModule, { rawBody: true }).
type RawBodyRequest = Request & { rawBody?: string };

/**
 * Payment webhook — the SOURCE OF TRUTH for activation. Success/cancel redirect
 * URLs must never mutate the subscription; only a verified webhook does.
 * Marked anonymous (no user session); authenticity comes from the signature.
 */
@ApiExcludeController()
@Controller('v1/webhooks/payments')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly billingService: BillingService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment gateway webhook' })
  async handleWebhook(
    @Req() request: RawBodyRequest,
    @Headers() headers: Record<string, string | undefined>,
  ): Promise<{ received: true }> {
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.warn(
        'Webhook missing raw body — signature verification needs exact bytes',
      );
      throw new UnauthorizedException('Invalid webhook payload');
    }

    const event = this.gateway.verifyAndParseWebhook(rawBody, headers);
    if (!event) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment.paid':
        await this.billingService.handlePaymentPaid({
          gatewayInvoiceId: event.gatewayInvoiceId,
          identifier: event.identifier,
          metadata: event.metadata,
        });
        break;
      case 'payment.failed':
        await this.billingService.handlePaymentFailed({
          gatewayInvoiceId: event.gatewayInvoiceId,
          identifier: event.identifier,
        });
        break;
      default:
        this.logger.debug(`Ignored webhook event type: ${event.type}`);
    }

    return { received: true };
  }
}
