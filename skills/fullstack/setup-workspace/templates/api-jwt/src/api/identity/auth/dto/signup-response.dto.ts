import { Field, ID, ObjectType } from '@nestjs/graphql';
import { TenantStatus } from '@/entities/identity/tenant.entity';

@ObjectType()
export class SignUpResponseDto {
  @Field(() => TenantStatus)
  tenantStatus: TenantStatus;

  @Field(() => ID)
  createdTenantId: string;

  @Field(() => ID)
  createdUserId: string;
}
