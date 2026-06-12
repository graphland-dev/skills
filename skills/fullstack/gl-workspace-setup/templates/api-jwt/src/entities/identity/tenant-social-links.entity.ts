import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class TenantSocialLinks {
  @Field(() => String, { nullable: true })
  @Prop()
  facebook: string;

  @Field(() => String, { nullable: true })
  @Prop()
  twitter: string;

  @Field(() => String, { nullable: true })
  @Prop()
  linkedin: string;

  @Field(() => String, { nullable: true })
  @Prop()
  instagram: string;

  @Field(() => String, { nullable: true })
  @Prop()
  youtube: string;

  @Field(() => String, { nullable: true })
  @Prop()
  tiktok: string;

  @Field(() => String, { nullable: true })
  @Prop()
  pinterest: string;
}
