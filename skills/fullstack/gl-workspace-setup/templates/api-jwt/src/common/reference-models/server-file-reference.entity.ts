import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

export enum ServerFileProvider {
  CLOUDINARY = 'CLOUDINARY',
  S3 = 'S3',
  DIRECT = 'DIRECT',
}
registerEnumType(ServerFileProvider, { name: 'ServerFileProvider' });

@Schema()
@ObjectType()
export class ServerFileReference {
  @Prop({ type: String, enum: ServerFileProvider })
  @Field(() => ServerFileProvider, { nullable: true })
  provider?: ServerFileProvider;

  @Prop()
  @Field(() => String, { nullable: true })
  key?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  external?: string;
}

@InputType()
export class ServerFileInput {
  @Field(() => ServerFileProvider, { nullable: true })
  provider?: ServerFileProvider;

  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => String, { nullable: true })
  external?: string;
}
