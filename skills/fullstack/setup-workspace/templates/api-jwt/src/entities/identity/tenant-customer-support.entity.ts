import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class TenantCustomerSupportInfo {
  @Field(() => String, { nullable: true })
  @Prop()
  email: string;

  @Field(() => String, { nullable: true })
  @Prop()
  phoneNumber: string;
}
