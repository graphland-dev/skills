import { Field, ObjectType } from '@nestjs/graphql';
import { UserTenant } from '@/entities/identity/user-tenant.entity';

@ObjectType()
export class LoginResponseDto {
  @Field(() => String)
  accessToken: string;

  @Field(() => [UserTenant], { nullable: true })
  memberships: UserTenant[];

  @Field(() => [String], { nullable: true })
  systemRoles: string[];
}
