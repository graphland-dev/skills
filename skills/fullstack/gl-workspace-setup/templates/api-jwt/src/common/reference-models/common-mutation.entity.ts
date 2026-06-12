import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CommonMutationResponse {
  @Field(() => ID)
  _id: string;
}
