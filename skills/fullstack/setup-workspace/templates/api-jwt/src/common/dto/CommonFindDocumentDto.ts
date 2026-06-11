import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

export enum MatchOperator {
  eq = 'eq',
  ne = 'ne',
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
  in = 'in',
  nin = 'nin',
  exists = 'exists',
  contains = 'contains',
  arrayItemsCountGte = 'arrayItemsCountGte',
  arrayItemsCountLte = 'arrayItemsCountLte',
}

registerEnumType(MatchOperator, {
  name: 'MatchOperator',
});

@InputType()
export class CommonFindDocumentDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  key?: string;

  @Field(() => MatchOperator, { nullable: true })
  @IsOptional()
  operator?: MatchOperator;

  @Field(() => String, { nullable: true })
  @IsOptional()
  value?: any;

  @Field(() => [CommonFindDocumentDto], { nullable: true })
  @IsOptional()
  and?: CommonFindDocumentDto[];

  @Field(() => [CommonFindDocumentDto], { nullable: true })
  @IsOptional()
  or?: CommonFindDocumentDto[];
}
