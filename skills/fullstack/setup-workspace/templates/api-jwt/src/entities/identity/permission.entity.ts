import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | '*';

@ObjectType()
@Schema({ collection: 'identity__Permission' })
export class RolePermission {
  @Prop()
  @Field(() => String)
  collectionName: string;

  @Prop()
  @Field(() => [String])
  actions: PermissionAction[];
}
