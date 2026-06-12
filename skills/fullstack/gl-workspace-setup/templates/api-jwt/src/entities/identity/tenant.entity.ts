import { Paginated } from '@/common/common-models/pagination-object';
import { LocationReference } from '@/common/reference-models/location-reference.entity';
import { ServerFileReference } from '@/common/reference-models/server-file-reference.entity';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { TenantSocialLinks } from '@/entities/identity/tenant-social-links.entity';
import { TenantCustomerSupportInfo } from '@/entities/identity/tenant-customer-support.entity';
import { TenantLegalPolicies } from '@/entities/identity/tenant-legal-policies.entity';
import { TenantCharge } from '@/entities/identity/tenant-delivery-charge.entity';
import { TenantIntegration } from '@/entities/identity/tenant-courier-integration.entity';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

registerEnumType(TenantStatus, {
  name: 'TenantStatus',
});

@ObjectType()
@Schema({ timestamps: true, collection: 'identity__Tenant' })
export class Tenant {
  @Field(() => ID)
  _id: string;

  @Prop()
  @Field(() => String)
  name: string;

  @Prop()
  @Field(() => ServerFileReference, { nullable: true })
  logo: ServerFileReference;

  @Prop()
  @Field(() => LocationReference, { nullable: true })
  address: LocationReference;

  @Prop()
  @Field(() => String, { nullable: true })
  businessPhoneNumber: string;

  @Prop()
  @Field(() => String, { nullable: true })
  description: string;

  @Prop()
  @Field(() => String, { nullable: true })
  uid: string;

  @Prop()
  @Field(() => String, { nullable: true })
  siteDomain: string;

  @Prop({ default: TenantStatus.PENDING })
  @Field(() => String, { nullable: true })
  status: TenantStatus;

  @Prop()
  @Field(() => TenantSocialLinks, { nullable: true })
  socialLinks: TenantSocialLinks;

  @Prop()
  @Field(() => TenantCustomerSupportInfo, { nullable: true })
  customerSupportInfo: TenantCustomerSupportInfo;

  @Prop()
  @Field(() => TenantLegalPolicies, { nullable: true })
  legalPolicies: TenantLegalPolicies;

  @Prop()
  @Field(() => TenantCharge, { nullable: true })
  charges: TenantCharge;

  /** Storefront theme JSON (themeName, globalSetting, globalItemsTop/Bottom, pages). Stored as object in Mongo; exposed as JSON string in GraphQL. */
  @Prop({ type: MongooseSchema.Types.Mixed })
  @Field(() => String, {
    nullable: true,
    description:
      'Theme JSON as string (themeName, globalSetting, globalItemsTop/Bottom, pages). Parse with JSON.parse on the client.',
  })
  themeJson: Record<string, unknown> | null;

  @Prop()
  @Field(() => TenantIntegration, { nullable: true })
  integration: TenantIntegration;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

export type TenantDocument = HydratedDocument<Tenant>;
export const TenantSchema = SchemaFactory.createForClass(Tenant);

// TenantSchema.pre('save', function (next) {
//   this.uid = this.name?.toLowerCase() + '--' + nanoid(6);
//   next();
// });

@ObjectType()
export class TenantsWithPagination extends Paginated(Tenant) {}
