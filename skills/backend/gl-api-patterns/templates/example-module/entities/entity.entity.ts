import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EntityStatus } from '../entity.contracts';

@Schema({
  timestamps: true,
  collection: 'entities',
})
export class Entity {
  /** Org-scoped multi-tenancy: every document carries the owning organization. */
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: String, enum: EntityStatus, default: EntityStatus.ACTIVE })
  status: EntityStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export type EntityDocument = HydratedDocument<Entity>;
export const EntitySchema = SchemaFactory.createForClass(Entity);

// Compound indexes for the common list query (org scope + recency)
EntitySchema.index({ organizationId: 1, createdAt: -1 });
EntitySchema.index({ organizationId: 1, status: 1 });
