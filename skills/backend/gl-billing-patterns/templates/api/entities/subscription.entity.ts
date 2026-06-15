import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { PaidPlanSlug, PlanFeatures, PlanLimits } from '@app/plans';
import { SubscriptionStatus } from '../billing.contracts';

/** One subscription document per organization (org-scoped multi-tenancy). */
@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ required: true, unique: true, index: true })
  organizationId: string;

  @Prop({ type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' })
  planSlug: PaidPlanSlug;

  @Prop({ type: String, enum: SubscriptionStatus, required: true })
  status: SubscriptionStatus;

  @Prop({ type: Date, default: null })
  trialEndsAt: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodStart: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd: Date | null;

  @Prop({ type: Boolean, default: false })
  cancelAtPeriodEnd: boolean;

  /** Enterprise per-org overrides (optional). */
  @Prop({ type: Object, default: null })
  customLimits: Partial<PlanLimits> | null;

  @Prop({ type: Object, default: null })
  customFeatures: Partial<PlanFeatures> | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SubscriptionDocument = HydratedDocument<Subscription>;
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes that back the scheduler queries.
SubscriptionSchema.index({ status: 1, trialEndsAt: 1 });
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
