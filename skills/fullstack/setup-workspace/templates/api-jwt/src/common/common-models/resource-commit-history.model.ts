import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { UserReference } from './user-reference.model';

@ObjectType()
@Schema()
export class ResourceCommitHistoryReference {
  constructor(
    commitedBy: UserReference,
    action:
      | 'create'
      | 'update'
      | 'delete'
      | 'remove-from-tenant'
      | 'add-as-customer'
      | 'update-user-tenant-role' = 'create',
  ) {
    this.commitedBy = commitedBy;
    this.action = action;
    this.committedAt = new Date();
  }

  @Field(() => UserReference, { nullable: true })
  @Prop()
  commitedBy: UserReference;

  @Field(() => String, { nullable: true })
  @Prop()
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'add-as-customer'
    | 'remove-from-tenant'
    | 'update-user-tenant-role';

  @Field(() => Date, { nullable: true })
  @Prop()
  committedAt: Date;
}
