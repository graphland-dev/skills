import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { BillingTermMonths, PaidPlanSlug } from '@app/plans';
import {
  BillingInvoicePurpose,
  BillingInvoiceStatus,
} from '../billing.contracts';

/**
 * Local mirror of a gateway invoice. `identifier` is the idempotency key —
 * `sub:{orgId}:activate:{term}m:{contextDate}` — so a retried checkout reuses
 * the same invoice and the webhook can match a payment back to an org/term.
 */
@Schema({ timestamps: true, collection: 'billing_invoices' })
export class BillingInvoice {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  subscriptionId: Types.ObjectId;

  /** Gateway-side invoice id (from the PaymentGateway adapter). */
  @Prop({ required: true, index: true })
  gatewayInvoiceId: string;

  @Prop({ required: true, unique: true })
  identifier: string;

  @Prop({ type: String, enum: ['free', 'pro', 'enterprise'], required: true })
  planSlug: PaidPlanSlug;

  @Prop({ type: Number, enum: [1, 6, 12], required: true })
  termMonths: BillingTermMonths;

  @Prop({ type: Number, required: true })
  discountPercent: number;

  @Prop({ type: Number })
  baseMonthlyAmount?: number;

  @Prop({ type: Number })
  amount?: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({
    type: String,
    enum: BillingInvoiceStatus,
    default: BillingInvoiceStatus.PENDING,
  })
  status: BillingInvoiceStatus;

  @Prop({ type: String, enum: BillingInvoicePurpose, required: true })
  purpose: BillingInvoicePurpose;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  supersededBy: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BillingInvoiceDocument = HydratedDocument<BillingInvoice>;
export const BillingInvoiceSchema =
  SchemaFactory.createForClass(BillingInvoice);

BillingInvoiceSchema.index({ organizationId: 1, createdAt: -1 });
BillingInvoiceSchema.index({ organizationId: 1, status: 1 });
