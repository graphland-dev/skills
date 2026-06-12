import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class TenantCharge {
  @Field(() => Float, { nullable: true })
  @Prop()
  deliveryInsideCapitalCharge: number;

  @Field(() => Float, { nullable: true })
  @Prop()
  deliveryOutsideCapitalCharge: number;

  @Field(() => Float, { nullable: true })
  @Prop()
  taxRate: number;
}
