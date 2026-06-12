import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class SteadfastCredentials {
  @Field(() => String, { nullable: true })
  @Prop()
  api_key: string;

  @Field(() => String, { nullable: true })
  @Prop()
  secret_key: string;
}

@ObjectType()
@Schema({ timestamps: true })
export class PathaoCredentials {
  @Field(() => Int, { nullable: true })
  @Prop()
  store_id: number;

  @Field(() => String, { nullable: true })
  @Prop()
  client_id: string;

  @Field(() => String, { nullable: true })
  @Prop()
  client_secret: string;

  @Field(() => String, { nullable: true })
  @Prop()
  username: string;

  @Field(() => String, { nullable: true })
  @Prop()
  password: string;
}

@ObjectType()
@Schema({ timestamps: true })
export class CourierProviders {
  @Field(() => SteadfastCredentials, { nullable: true })
  @Prop()
  steadfast: SteadfastCredentials;

  @Field(() => PathaoCredentials, { nullable: true })
  @Prop()
  pathao: PathaoCredentials;
}

@ObjectType()
@Schema({ timestamps: true })
export class TenantIntegration {
  @Field(() => CourierProviders, { nullable: true })
  @Prop()
  courier: CourierProviders;
}
