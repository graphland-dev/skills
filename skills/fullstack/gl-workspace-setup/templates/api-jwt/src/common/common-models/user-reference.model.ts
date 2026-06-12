import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@ObjectType()
@Schema({ timestamps: true, collection: 'common__UserReference' })
export class UserReference {
  @Field(() => ID, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  referenceId: string;

  @Prop()
  @Field(() => String, { nullable: true })
  name?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  email?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;
}
