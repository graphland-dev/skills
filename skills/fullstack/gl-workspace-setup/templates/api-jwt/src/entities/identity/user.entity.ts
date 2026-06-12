import { Paginated } from '@/common/common-models/pagination-object';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ServerFileReference } from '@/common/reference-models/server-file-reference.entity';
import { ResourceCommitHistoryReference } from '@/common/common-models/resource-commit-history.model';
import { LocationReference } from '@/common/reference-models/location-reference.entity';

import { HydratedDocument } from 'mongoose';
import { UserTenant } from '@/entities/identity/user-tenant.entity';

export { UserDomain } from './user-domain.enum';

export enum UserAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
registerEnumType(UserAccountStatus, { name: 'UserAccountStatus' });

@ObjectType()
@Schema({
  timestamps: true,
  collection: 'identity__User',
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})
export class User {
  @Field(() => ID)
  _id: string;

  @Prop()
  @Field(() => [ResourceCommitHistoryReference], { nullable: true })
  commits: ResourceCommitHistoryReference[];

  @Prop()
  @Field(() => String, { nullable: true })
  name: string;

  @Prop()
  @Field(() => String, { nullable: true })
  phoneNumber: string;

  @Prop()
  @Field(() => ServerFileReference, { nullable: true })
  avatar: ServerFileReference;

  @Prop()
  @Field(() => String, { nullable: true })
  email: string;

  @Prop()
  @Field(() => [LocationReference], { nullable: true })
  shippingAddress: LocationReference[];

  @Prop()
  password: string;

  @Prop()
  @Field(() => [UserTenant], { nullable: true })
  memberships: UserTenant[];

  @Prop()
  @Field(() => [String], { nullable: true })
  systemRoles: string[];

  @Prop({ default: UserAccountStatus.ACTIVE })
  @Field(() => UserAccountStatus, { nullable: true })
  accountStatus?: UserAccountStatus;

  @Field(() => Date, { nullable: true })
  @Prop()
  lastLoginAt?: Date;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

// UserSchema.pre('save', function (next) {
//   if (this.password) this.password = bcrypt.hashSync(this.password);
//   next();
// });

@ObjectType()
export class UsersWithPagination extends Paginated(User) {}
