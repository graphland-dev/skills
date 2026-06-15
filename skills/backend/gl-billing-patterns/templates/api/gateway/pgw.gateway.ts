import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Reference adapter for Graphland PGW. Install `@graphland/pgw-merchant`.
// For Stripe/Paddle/etc., write a sibling adapter implementing PaymentGateway.
import {
  GraphlandPGWClient,
  parseWebhookEvent,
  verifyWebhookSignature,
} from '@graphland/pgw-merchant';
import type {
  CreateInvoiceInput,
  CreateInvoiceResult,
  GatewayInvoiceStatus,
  NormalizedWebhookEvent,
  PaymentGateway,
} from './payment-gateway.interface';

@Injectable()
export class PgwGateway implements PaymentGateway {
  private client: GraphlandPGWClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('billing.pgw.apiKey', '')?.trim(),
    );
  }

  private getClient(): GraphlandPGWClient {
    if (!this.client) {
      this.client = new GraphlandPGWClient({
        apiKey: this.configService.get<string>('billing.pgw.apiKey', ''),
        clientId: this.configService.get<string>('billing.pgw.clientId', ''),
        baseUrl: this.configService.get<string>('billing.pgw.baseUrl', ''),
      });
    }
    return this.client;
  }

  async createInvoice(
    input: CreateInvoiceInput,
  ): Promise<CreateInvoiceResult> {
    const result = await this.getClient().createInvoice({
      identifier: input.identifier,
      amount: input.amount,
      currency: input.currency,
      customer: input.customer,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      failUrl: input.failUrl,
      metadata: input.metadata,
    });
    return {
      gatewayInvoiceId: result.invoiceUID,
      paymentUrl: result.paymentUrl,
    };
  }

  async getInvoiceStatus(
    gatewayInvoiceId: string,
  ): Promise<GatewayInvoiceStatus> {
    const result = await this.getClient().getInvoiceStatus(gatewayInvoiceId);
    return result.status as GatewayInvoiceStatus;
  }

  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): NormalizedWebhookEvent | null {
    const secret = this.configService
      .get<string>('billing.pgw.webhookSecret', '')
      ?.trim();
    const signature = headers['x-graphland-signature'];
    const timestamp = headers['x-graphland-timestamp'];

    if (!secret || !signature || !timestamp) {
      return null;
    }

    // Verify over the EXACT raw bytes — never the JSON-parsed body.
    const valid = verifyWebhookSignature(
      rawBody,
      { signature, timestamp },
      secret,
    );
    if (!valid) {
      return null;
    }

    const event = parseWebhookEvent(rawBody);
    const type =
      event.type === 'payment.paid'
        ? 'payment.paid'
        : event.type === 'payment.failed'
          ? 'payment.failed'
          : 'unknown';

    return {
      type,
      gatewayInvoiceId: event.data.invoiceUID,
      identifier: event.data.identifier,
      metadata: event.data.metadata as
        | Record<string, string | undefined>
        | undefined,
    };
  }
}
