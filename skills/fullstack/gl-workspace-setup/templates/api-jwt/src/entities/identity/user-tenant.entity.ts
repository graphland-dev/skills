import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { Role } from '@/entities/identity/role.entity';
import { UserDomain } from '@/entities/identity/user-domain.enum';

export type UserTenantMembershipRole =
  | 'system:admin'
  | 'customer:general'
  | 'merchant:admin';

@ObjectType()
@Schema()
export class UserTenant {
  @Prop()
  @Field(() => String, { nullable: true })
  tenant: string;

  @Prop({ type: [String], ref: Role.name, default: [] })
  @Field(() => [String], { nullable: true })
  roles: UserTenantMembershipRole[];

  @Prop({ type: String, enum: UserDomain })
  @Field(() => UserDomain, { nullable: true })
  userDomain: UserDomain;
}
