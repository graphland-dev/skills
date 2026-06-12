import { Types } from 'mongoose';
import {
  CommonFindDocumentDto,
  MatchOperator,
} from '@/common/dto/CommonFindDocumentDto';
import { WHERE_OPERATOR } from '@/common/dto/CommonPaginationDto';

const valueWrapperForKey = (key: string, value: unknown) => {
  switch (key) {
    case 'createdAt':
    case 'updatedAt':
      return new Date(value as string | number | Date).toISOString();
    case '_id':
      return new Types.ObjectId(value as string);
    default:
      return value;
  }
};

export const mongodbFindObjectBuilder = (filter: CommonFindDocumentDto) => {
  if (filter?.and !== undefined) {
    const andQ = filter.and?.map((a) => mongodbFindObjectBuilder(a));
    return { $and: andQ };
  }
  if (filter?.or !== undefined) {
    const orQ = filter?.or?.map((a) => mongodbFindObjectBuilder(a));
    return { $or: orQ };
  }

  if (
    filter?.value === null ||
    filter?.value === undefined ||
    filter?.value === ''
  ) {
    return {};
  }

  switch (filter.operator) {
    case MatchOperator.eq:
      return { [filter.key]: valueWrapperForKey(filter.key, filter.value) };
    case MatchOperator.ne:
      return {
        [filter.key]: { $ne: valueWrapperForKey(filter.key, filter.value) },
      };
    case MatchOperator.gt:
      return {
        [filter.key]: { $gt: valueWrapperForKey(filter.key, filter.value) },
      };
    case MatchOperator.gte:
      return {
        [filter.key]: { $gte: valueWrapperForKey(filter.key, filter.value) },
      };
    case MatchOperator.lt:
      return {
        [filter.key]: { $lt: valueWrapperForKey(filter.key, filter.value) },
      };
    case MatchOperator.lte:
      return {
        [filter.key]: { $lte: valueWrapperForKey(filter.key, filter.value) },
      };
    case MatchOperator.in:
      if (!filter.value) {
        return {};
      }
      return { [filter.key]: { $in: filter.value.split(',') } };
    case MatchOperator.nin:
      if (!filter.value) {
        return {};
      }
      return { [filter.key]: { $nin: filter.value.split(',') } };
    case MatchOperator.arrayItemsCountGte:
      return {
        $expr: { $gte: [{ $size: `$${filter.key}` }, +filter?.value] },
      };
    case MatchOperator.arrayItemsCountLte:
      return {
        $expr: { $lte: [{ $size: `$${filter.key}` }, +filter?.value] },
      };
    case MatchOperator.exists:
      return { [filter.key]: { $exists: StringToBoolean(filter.value) } };
    case MatchOperator.contains:
      if (!filter.value) {
        return {};
      }
      return { [filter.key]: { $regex: filter.value, $options: 'i' } };
    default:
      return { [filter.key]: filter.value };
  }
};

const StringToBoolean = (value: string) => {
  return value === 'true';
};

interface IFilterBuilder {
  filters: CommonFindDocumentDto[];
  multiFilterOperator: WHERE_OPERATOR;
  preFilter?: CommonFindDocumentDto;
}

export const mongoDbMultiFilterBuilder = ({
  filters,
  multiFilterOperator,
  preFilter,
}: IFilterBuilder) => {
  const where: Record<string, unknown> = {};
  const whereConditions =
    filters?.map((item) => mongodbFindObjectBuilder(item)) || [];

  const andOr = multiFilterOperator ? `$${multiFilterOperator}` : `$and`;

  if (preFilter) {
    where['$and'] = [{ [andOr]: whereConditions }, preFilter];
  }
  if (!preFilter && whereConditions.length > 0) {
    where[andOr] = whereConditions;
  }

  return where;
};
