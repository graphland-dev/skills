import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

@ObjectType()
@Schema({ timestamps: true, collection: 'common__LocationReference' })
export class LocationReference {
  @Field(() => String, { nullable: true })
  @Prop()
  caption: string;

  @Field(() => Number, { nullable: true })
  @Prop()
  latitude: number;

  @Field(() => Number, { nullable: true })
  @Prop()
  longitude: number;
}

@InputType()
export class LocationReferenceInput {
  @Field(() => String, { nullable: true })
  @ApiProperty()
  @IsOptional()
  caption: string;

  @Field(() => Number, { nullable: true })
  @ApiProperty()
  @IsOptional()
  latitude: number;

  @Field(() => Number, { nullable: true })
  @ApiProperty()
  @IsOptional()
  longitude: number;
}
