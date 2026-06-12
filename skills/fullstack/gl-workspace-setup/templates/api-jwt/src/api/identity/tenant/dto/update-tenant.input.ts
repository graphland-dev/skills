import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateTenantInput } from './create-tenant.input';
import { ApiProperty } from '@nestjs/swagger';
import { ServerFileInput } from '@/common/reference-models/server-file-reference.entity';
import { IsOptional } from 'class-validator';

@InputType()
export class UpdateTenantInput extends OmitType(
  PartialType(CreateTenantInput),
  ['uid'],
) {
  @ApiProperty()
  @IsOptional()
  @Field(() => ServerFileInput, { nullable: true })
  logo?: ServerFileInput;
}
