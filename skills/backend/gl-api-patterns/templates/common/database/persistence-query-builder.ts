type FilterQuery<T> = Record<string, unknown> & Partial<T>;

type GeoCoordinates =
  | [number, number]
  | { latitude: number; longitude: number };

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IPersistence {
  export enum FilterOperator {
    EQ = 'eq',
    NE = 'ne',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    IN = 'in',
    NIN = 'nin',
    CONTAINS = 'contains',
    EXISTS = 'exists',
    STARTS_WITH = 'startsWith',
    ENDS_WITH = 'endsWith',
    REGEX = 'regex',
    NEAR = 'near',
  }

  export enum LogicalOperator {
    AND = 'and',
    OR = 'or',
    NOR = 'nor',
  }

  export interface FilterField<T = unknown> {
    key: keyof T | string;
    operator: FilterOperator;
    value: unknown;
  }

  export interface DateRangeFilter<T = unknown> {
    key: keyof T;
    from?: Date | string;
    to?: Date | string;
  }

  export interface ComplexFilter<T = unknown> {
    operator: LogicalOperator;
    filters: (FilterField<T> | DateRangeFilter<T> | ComplexFilter<T>)[];
  }

  export type Filter<T = unknown> =
    | FilterField<T>
    | DateRangeFilter<T>
    | ComplexFilter<T>;
}

export function processFilterField<T>(
  filter: IPersistence.FilterField<T>,
): FilterQuery<T> {
  const { key, operator, value } = filter;

  if (value === null || value === undefined) {
    if (operator === IPersistence.FilterOperator.EQ) {
      return {};
    } else if (operator === IPersistence.FilterOperator.NE) {
      return { [key]: { $ne: null } } as FilterQuery<T>;
    } else if (operator === IPersistence.FilterOperator.EXISTS) {
      return { [key]: { $exists: false } } as FilterQuery<T>;
    }
    return {};
  }

  switch (operator) {
    case IPersistence.FilterOperator.EQ:
      return { [key]: value } as FilterQuery<T>;
    case IPersistence.FilterOperator.NE:
      return { [key]: { $ne: value } } as FilterQuery<T>;
    case IPersistence.FilterOperator.GT:
      return { [key]: { $gt: value } } as FilterQuery<T>;
    case IPersistence.FilterOperator.GTE:
      return { [key]: { $gte: value } } as FilterQuery<T>;
    case IPersistence.FilterOperator.LT:
      return { [key]: { $lt: value } } as FilterQuery<T>;
    case IPersistence.FilterOperator.LTE:
      return { [key]: { $lte: value } } as FilterQuery<T>;
    case IPersistence.FilterOperator.IN: {
      const inValues = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',').map((item) => item.trim())
          : [value];
      return { [key]: { $in: inValues } } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.NIN: {
      const ninValues = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',').map((item) => item.trim())
          : [value];
      return { [key]: { $nin: ninValues } } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.EXISTS:
      return {
        [key]: { $exists: value === true || value === 'true' },
      } as FilterQuery<T>;
    case IPersistence.FilterOperator.CONTAINS: {
      const pattern = typeof value === 'string' ? value : '';
      return { [key]: { $regex: pattern, $options: 'i' } } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.STARTS_WITH: {
      const pattern = typeof value === 'string' ? value : '';
      return {
        [key]: { $regex: `^${pattern}`, $options: 'i' },
      } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.ENDS_WITH: {
      const pattern = typeof value === 'string' ? value : '';
      return {
        [key]: { $regex: `${pattern}$`, $options: 'i' },
      } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.REGEX: {
      const pattern = typeof value === 'string' ? value : '';
      return { [key]: { $regex: pattern, $options: 'i' } } as FilterQuery<T>;
    }
    case IPersistence.FilterOperator.NEAR:
      if (
        typeof value === 'object' &&
        value !== null &&
        'coordinates' in value &&
        'maxDistance' in value
      ) {
        const nearValue = value as {
          coordinates: GeoCoordinates;
          maxDistance: number;
        };
        return {
          [key]: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: nearValue.coordinates,
              },
              $maxDistance: nearValue.maxDistance,
            },
          },
        } as FilterQuery<T>;
      }
      return {};
    default:
      return { [key]: value } as FilterQuery<T>;
  }
}

export function processDateRangeFilter<T>(
  filter: IPersistence.DateRangeFilter<T>,
): FilterQuery<T> {
  const { key, from, to } = filter;
  const conditions: Record<string, Date> = {};

  if (from) {
    conditions.$gte = from instanceof Date ? from : new Date(from);
  }

  if (to) {
    conditions.$lte = to instanceof Date ? to : new Date(to);
  }

  if (Object.keys(conditions).length === 0) {
    return {};
  }

  return { [key]: conditions } as FilterQuery<T>;
}

export function processComplexFilter<T>(
  filter: IPersistence.ComplexFilter<T>,
): FilterQuery<T> {
  const { operator, filters } = filter;

  if (!filters?.length) {
    return {};
  }

  const processedFilters = filters
    .map((subFilter) => processFilter<T>(subFilter))
    .filter((item) => Object.keys(item).length > 0);

  if (processedFilters.length === 0) {
    return {};
  }

  const mongoOperator = `$${operator.toLowerCase()}`;
  return { [mongoOperator]: processedFilters } as FilterQuery<T>;
}

export function processFilter<T>(
  filter: IPersistence.Filter<T>,
): FilterQuery<T> {
  if ('operator' in filter && 'filters' in filter) {
    return processComplexFilter<T>(filter);
  }

  if ('from' in filter || 'to' in filter) {
    return processDateRangeFilter<T>(filter);
  }

  if ('key' in filter && 'operator' in filter) {
    return processFilterField<T>(filter);
  }

  return {};
}

export function buildQuery<T>(
  filters?: IPersistence.Filter<T> | null,
): FilterQuery<T> {
  if (!filters) {
    return {};
  }

  return processFilter<T>(filters);
}

export function eq<T>(
  field: (keyof T & string) | string,
  value: unknown,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.EQ, value };
}

export function ne<T>(
  field: keyof T & string,
  value: unknown,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.NE, value };
}

export function dateRange<T>(
  field: keyof T & string,
  from?: Date | string,
  to?: Date | string,
): IPersistence.DateRangeFilter<T> {
  return { key: field, from, to };
}

export function and<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.AND, filters };
}

export function or<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.OR, filters };
}

export function nor<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.NOR, filters };
}

export function contains<T>(
  field: keyof T & string,
  value: string,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.CONTAINS, value };
}

export function inArray<T>(
  field: keyof T & string,
  values: unknown[],
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.IN,
    value: values,
  };
}

export function ninArray<T>(
  field: keyof T & string,
  values: unknown[],
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.NIN,
    value: values,
  };
}

export function near<T>(
  field: keyof T & string,
  coordinates: GeoCoordinates,
  maxDistance: number,
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.NEAR,
    value: {
      coordinates,
      maxDistance,
    },
  };
}
