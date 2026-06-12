import { Paginated } from '@/common/common-models/pagination-object';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RolePermission } from '@/entities/identity/permission.entity';

@ObjectType()
@Schema({ collection: 'identity__Role' })
export class Role {
  @Field(() => ID)
  _id?: number;

  @Prop()
  @Field(() => String)
  name: string;

  @Prop()
  @Field(() => String, { nullable: true })
  tenant?: string;

  @Prop()
  @Field(() => [RolePermission])
  permissions: RolePermission[];

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => Date)
  updatedAt?: Date;
}
export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);
@ObjectType()
export class RolesWithPagination extends Paginated(Role) {}
