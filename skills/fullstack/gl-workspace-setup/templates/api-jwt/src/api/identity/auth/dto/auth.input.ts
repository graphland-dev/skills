import { LocationReferenceInput } from '@/common/reference-models/location-reference.entity';
import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CustomerSendOtpInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tenant: string;
}

@InputType()
export class CustomerOtpLoginInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otpCode: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  clientUrlTemplate: string;
}
@InputType()
export class ResetPasswordInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class LoginInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class SignUpInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  tenantName: string;

  @Field(() => LocationReferenceInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenantAddress: LocationReferenceInput;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenantBusinessPhoneNumber: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  tenantUid: string;
}
