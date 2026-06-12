import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * VendorReference - Embedded reference to a vendor/supplier
 * Used in Invoice and other entities to track which vendor supplied the order
 */
@Schema()
@ObjectType()
export class VendorReference {
  @Prop()
  @Field(() => String, { nullable: true })
  referenceId?: string;

  @Prop()
  @Field(() => String)
  name: string;

  @Prop()
  @Field(() => String, { nullable: true })
  email?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;
}

@InputType()
export class VendorReferenceInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  referenceId?: string;

  @Field(() => String)
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;
}
