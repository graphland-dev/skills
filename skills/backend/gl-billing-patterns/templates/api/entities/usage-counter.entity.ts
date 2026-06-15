import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Metered usage per org per period. `periodKey` is `trial:{orgId}` during the
 * trial (lifetime cap) or `YYYY-MM` while active (resets each calendar month).
 * Add one numeric column per metered action you track.
 */
@Schema({
  timestamps: { createdAt: false, updatedAt: true },
  collection: 'usage_counters',
})
export class UsageCounter {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  periodKey: string;

  @Prop({ type: Number, default: 0 })
  requestsUsed: number;

  updatedAt?: Date;
}

export type UsageCounterDocument = HydratedDocument<UsageCounter>;
export const UsageCounterSchema = SchemaFactory.createForClass(UsageCounter);

UsageCounterSchema.index({ organizationId: 1, periodKey: 1 }, { unique: true });
