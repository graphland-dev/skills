import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import {
  LocationReference,
  LocationReferenceInput,
} from './location-reference.entity';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

@Schema()
@ObjectType()
export class CustomerReference {
  @Prop()
  @Field(() => String, { nullable: true })
  referenceId?: string;

  @Prop()
  @Field(() => String)
  name: string;

  @Prop()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  email?: string;

  @Prop()
  @Field(() => LocationReference, { nullable: true })
  location?: LocationReference;
}

@InputType()
export class CustomerReferenceInput {
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
  phoneNumber?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => LocationReferenceInput, { nullable: true })
  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationReferenceInput)
  location?: LocationReferenceInput;
}
