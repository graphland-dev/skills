import { ServerFileInput } from '@/common/reference-models/server-file-reference.entity';
import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserDomain } from '@/entities/identity/user-domain.enum';
import { UserAccountStatus } from '@/entities/identity/user.entity';
import { LocationReferenceInput } from '@/common/reference-models/location-reference.entity';

export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }
}

@InputType()
export class UserTenantInput {
  @Field(() => String, { nullable: true })
  tenantId: string;

  @Field(() => String, { nullable: true })
  roles: string;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => ServerFileInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  avatar?: ServerFileInput;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @Field(() => UserDomain)
  @ApiProperty()
  @IsNotEmpty()
  userDomain: UserDomain;

  @Field(() => [UserTenantInput], { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenants: UserTenantInput;
}

@InputType()
export class CreateUserByAdminInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;

  @Field(() => ServerFileInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  avatar?: ServerFileInput;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenant: string;

  @Field(() => [String])
  @ApiProperty()
  @IsNotEmpty()
  roles: string[];

  @Field(() => UserDomain)
  @ApiProperty()
  @IsNotEmpty()
  userDomain: UserDomain;

  @Field(() => UserAccountStatus, { nullable: true })
  @ApiProperty()
  @IsOptional()
  accountStatus?: UserAccountStatus;
}

@InputType()
export class UpdateMeInput extends OmitType(PartialType(CreateUserInput), [
  'password',
  'tenants',
]) {
  @Field(() => [LocationReferenceInput], { nullable: true })
  @ApiProperty()
  @IsOptional()
  shippingAddress?: LocationReferenceInput[];
}

@InputType()
export class UpdateMyPasswordInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  @Match('newPassword')
  confirmNewPassword: string;
}

@InputType()
export class AddUserToTenantInput {
  @ApiProperty()
  @IsOptional()
  @Field(() => String)
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Field(() => [String])
  roles: string[];

  @ApiProperty()
  @IsOptional()
  @Field(() => UserDomain, { nullable: true })
  userDomain: UserDomain;
}

@InputType()
export class CreateCustomerInput {
  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  phoneNumber?: string;

  @Field(() => ServerFileInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  avatar?: ServerFileInput;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  tenant?: string;
}
