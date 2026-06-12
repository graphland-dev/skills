import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class TenantLegalPolicies {
  @Field(() => String, { nullable: true })
  @Prop()
  privacyPolicy: string;

  @Field(() => String, { nullable: true })
  @Prop()
  refundPolicy: string;

  @Field(() => String, { nullable: true })
  @Prop()
  termsAndConditions: string;
}
