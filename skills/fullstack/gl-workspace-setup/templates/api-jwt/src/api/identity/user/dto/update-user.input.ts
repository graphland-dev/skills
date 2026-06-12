import { InputType, PartialType } from '@nestjs/graphql';
import { CreateUserByAdminInput } from './create-user.input';

@InputType()
export class UpdateUserFromAdmin extends PartialType(CreateUserByAdminInput) {}
