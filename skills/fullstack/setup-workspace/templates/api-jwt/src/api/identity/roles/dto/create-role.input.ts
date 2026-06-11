import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | '*';

@InputType()
export class RolePermissionInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  collectionName: string;

  @Field(() => [String])
  @ApiProperty()
  @IsOptional()
  actions?: PermissionAction[];
}

@InputType()
export class CreateRoleInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => [RolePermissionInput], { nullable: true })
  @ApiProperty()
  @IsNotEmpty()
  permissions: RolePermissionInput[];

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenantId?: string;
}
