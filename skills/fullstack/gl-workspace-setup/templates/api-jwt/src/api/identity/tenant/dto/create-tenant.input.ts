import { Field, Float, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { TenantStatus } from '@/entities/identity/tenant.entity';
import { LocationReferenceInput } from '@/common/reference-models/location-reference.entity';
import { ServerFileInput } from '@/common/reference-models/server-file-reference.entity';
import { Type } from 'class-transformer';

@InputType()
export class TenantSocialLinksInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  facebook: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  twitter: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  linkedin: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  instagram: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  youtube: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  tiktok: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsUrl()
  pinterest: string;
}

@InputType()
export class TenantCustomerSupportInfoInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  phoneNumber: string;
}

@InputType()
export class TenantChargeInput {
  @Field(() => Float, { nullable: true })
  @ApiProperty()
  @IsOptional()
  deliveryInsideCapitalCharge: number;

  @Field(() => Float, { nullable: true })
  @ApiProperty()
  @IsOptional()
  deliveryOutsideCapitalCharge: number;

  @Field(() => Float, { nullable: true })
  @ApiProperty()
  @IsOptional()
  taxRate: number;
}

@InputType()
export class TenantLegalPoliciesInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  privacyPolicy: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  refundPolicy: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  termsAndConditions: string;
}

@InputType()
export class SteadfastCredentialsInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  api_key: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  secret_key: string;
}

@InputType()
export class PathaoCredentialsInput {
  @Field(() => Number, { nullable: true })
  @ApiProperty()
  @IsOptional()
  store_id: number;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  client_id: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  client_secret: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  username: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  password: string;
}

@InputType()
export class CourierProvidersInput {
  @Field(() => SteadfastCredentialsInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => SteadfastCredentialsInput)
  steadfast: SteadfastCredentialsInput;

  @Field(() => PathaoCredentialsInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => PathaoCredentialsInput)
  pathao: PathaoCredentialsInput;
}

@InputType()
export class TenantIntegrationInput {
  @Field(() => CourierProvidersInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CourierProvidersInput)
  courier: CourierProvidersInput;
}

@InputType()
export class CreateTenantInput {
  @Field(() => String, { description: 'Tenant name' })
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => ServerFileInput)
  @ApiProperty()
  @IsOptional()
  logo?: ServerFileInput;

  @Field(() => String, { description: 'Tenant UID' })
  @ApiProperty()
  @IsNotEmpty()
  uid: string;

  @Field(() => String, {
    nullable: true,
    description: 'Storefront site domain',
  })
  @ApiProperty({ required: false })
  @IsOptional()
  siteDomain?: string;

  @ApiProperty()
  @IsOptional()
  @Field(() => LocationReferenceInput, { nullable: true })
  address: LocationReferenceInput;

  @ApiProperty()
  @IsOptional()
  @Field(() => String, { nullable: true })
  businessPhoneNumber: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  status: TenantStatus;

  @ApiProperty()
  @IsOptional()
  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => TenantSocialLinksInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TenantSocialLinksInput)
  socialLinks: TenantSocialLinksInput;

  @Field(() => TenantCustomerSupportInfoInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TenantCustomerSupportInfoInput)
  customerSupportInfo: TenantCustomerSupportInfoInput;

  @Field(() => TenantLegalPoliciesInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TenantLegalPoliciesInput)
  legalPolicies: TenantLegalPoliciesInput;

  @Field(() => TenantChargeInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TenantChargeInput)
  charges: TenantChargeInput;

  /** Storefront theme JSON as string (themeName, globalSetting, globalItemsTop/Bottom, pages). Pass JSON.stringify(theme) from client. */
  @Field(() => String, { nullable: true })
  @ApiProperty({ required: false })
  @IsOptional()
  themeJson?: string;

  @Field(() => TenantIntegrationInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantIntegrationInput)
  integration: TenantIntegrationInput;
}
