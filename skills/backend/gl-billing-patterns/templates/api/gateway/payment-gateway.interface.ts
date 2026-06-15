/**
 * Provider-agnostic payment gateway port. Implement this for whatever provider
 * you use (Graphland PGW, Stripe, Paddle, …) and bind it to the PAYMENT_GATEWAY
 * token in BillingModule. The billing service depends only on this interface,
 * so swapping providers never touches subscription/entitlement logic.
 */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CreateInvoiceInput {
  /** Idempotency key — reuse the same value to avoid duplicate invoices. */
  identifier: string;
  /** Major currency units (e.g. 2900, not minor units). */
  amount: number;
  currency: string;
  customer: { id: string; email?: string; name?: string };
  successUrl: string;
  cancelUrl: string;
  failUrl: string;
  /** Echoed back on the webhook — put planSlug/termMonths here. */
  metadata?: Record<string, string>;
}

export interface CreateInvoiceResult {
  gatewayInvoiceId: string;
  paymentUrl: string;
}

export type GatewayInvoiceStatus = 'pending' | 'paid' | 'failed';

export interface NormalizedWebhookEvent {
  type: 'payment.paid' | 'payment.failed' | 'unknown';
  gatewayInvoiceId: string;
  identifier: string;
  metadata?: Record<string, string | undefined>;
}

export interface PaymentGateway {
  isConfigured(): boolean;
  createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult>;
  getInvoiceStatus(gatewayInvoiceId: string): Promise<GatewayInvoiceStatus>;
  /**
   * Verify the signature over the RAW request body (exact bytes) and return the
   * normalized event, or null when the signature is invalid.
   */
  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): NormalizedWebhookEvent | null;
}
