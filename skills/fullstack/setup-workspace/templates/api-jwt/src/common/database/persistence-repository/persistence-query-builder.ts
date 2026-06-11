// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IPersistence {
  // Define filter operators enum
  export enum FilterOperator {
    EQ = 'eq', // Equals
    NE = 'ne', // Not equals
    GT = 'gt', // Greater than
    GTE = 'gte', // Greater than or equal
    LT = 'lt', // Less than
    LTE = 'lte', // Less than or equal
    IN = 'in', // In array
    NIN = 'nin', // Not in array
    CONTAINS = 'contains', // String contains (case-insensitive)
    EXISTS = 'exists', // Field exists
    STARTS_WITH = 'startsWith', // String starts with
    ENDS_WITH = 'endsWith', // String ends with
    REGEX = 'regex', // Regular expression match
    NEAR = 'near', // Geospatial near
  }

  // Define logical operators enum
  export enum LogicalOperator {
    AND = 'and',
    OR = 'or',
    NOR = 'nor',
  }

  // Basic filter field with support for nested keys
  export interface FilterField<T = any> {
    key: keyof T | string; // Allow both typed keys and string paths for nested objects
    operator: FilterOperator;
    value: any;
  }

  // Date range filter
  export interface DateRangeFilter<T = any> {
    key: keyof T | string; // Allow both typed keys and string paths for nested objects
    from?: Date | string;
    to?: Date | string;
  }

  // Complex filter with nesting
  export interface ComplexFilter<T = any> {
    operator: LogicalOperator;
    filters: (FilterField<T> | DateRangeFilter<T> | ComplexFilter<T>)[];
  }

  // Union type of all filter types
  export type Filter<T = any> =
    | FilterField<T>
    | DateRangeFilter<T>
    | ComplexFilter<T>;
}

// Import FilterQuery from mongoose to use in the return types
import { FilterQuery } from 'mongoose';

/**
 * Process a single filter field
 */
export function processFilterField<T>(
  filter: IPersistence.FilterField<T>,
): FilterQuery<T> {
  const { key, operator, value } = filter;

  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (operator === IPersistence.FilterOperator.EQ) {
      return {} as any;
      // return { [field]: null } as any;
    } else if (operator === IPersistence.FilterOperator.NE) {
      return { [key]: { $ne: null } } as any;
    } else if (operator === IPersistence.FilterOperator.EXISTS) {
      return { [key]: { $exists: false } } as any;
    }
    return {} as any;
  }

  switch (operator) {
    case IPersistence.FilterOperator.EQ:
      return { [key]: value } as any;

    case IPersistence.FilterOperator.NE:
      return { [key]: { $ne: value } } as any;

    case IPersistence.FilterOperator.GT:
      return { [key]: { $gt: value } } as any;

    case IPersistence.FilterOperator.GTE:
      return { [key]: { $gte: value } } as any;

    case IPersistence.FilterOperator.LT:
      return { [key]: { $lt: value } } as any;

    case IPersistence.FilterOperator.LTE:
      return { [key]: { $lte: value } } as any;

    case IPersistence.FilterOperator.IN:
      const inValues = Array.isArray(value)
        ? value
        : value.split(',').map((v) => v.trim());
      return { [key]: { $in: inValues } } as any;

    case IPersistence.FilterOperator.NIN:
      const ninValues = Array.isArray(value)
        ? value
        : value.split(',').map((v) => v.trim());
      return { [key]: { $nin: ninValues } } as any;

    case IPersistence.FilterOperator.EXISTS:
      return {
        [key]: { $exists: value === true || value === 'true' },
      } as any;

    case IPersistence.FilterOperator.CONTAINS:
      return { [key]: { $regex: value, $options: 'i' } } as any;

    case IPersistence.FilterOperator.STARTS_WITH:
      return { [key]: { $regex: `^${value}`, $options: 'i' } } as any;

    case IPersistence.FilterOperator.ENDS_WITH:
      return { [key]: { $regex: `${value}$`, $options: 'i' } } as any;

    case IPersistence.FilterOperator.REGEX:
      return { [key]: { $regex: value, $options: 'i' } } as any;

    case IPersistence.FilterOperator.NEAR:
      if (typeof value === 'object' && value.coordinates && value.maxDistance) {
        return {
          [key]: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: value.coordinates,
              },
              $maxDistance: value.maxDistance,
            },
          },
        } as any;
      }
      return {} as any;

    default:
      return { [key]: value } as any;
  }
}

/**
 * Process a date range filter
 */
export function processDateRangeFilter<T>(
  filter: IPersistence.DateRangeFilter<T>,
): FilterQuery<T> {
  const { key, from, to } = filter;
  const conditions: any = {};

  if (from) {
    conditions.$gte = from instanceof Date ? from : new Date(from);
  }

  if (to) {
    conditions.$lte = to instanceof Date ? to : new Date(to);
  }

  if (Object.keys(conditions).length === 0) {
    return {} as any;
  }

  return { [key]: conditions } as any;
}

/**
 * Recursively process a complex filter with nested conditions
 */
export function processComplexFilter<T>(
  filter: IPersistence.ComplexFilter<T>,
): FilterQuery<T> {
  const { operator, filters } = filter;

  if (!filters || !filters.length) {
    return {} as any;
  }

  const processedFilters = filters
    .map((subFilter) => processFilter<T>(subFilter))
    .filter((f) => Object.keys(f).length > 0);

  if (processedFilters.length === 0) {
    return {} as any;
  }

  const mongoOperator = `$${operator.toLowerCase()}`;
  return { [mongoOperator]: processedFilters } as any;
}

/**
 * Process any type of filter
 */
export function processFilter<T>(
  filter: IPersistence.Filter<T>,
): FilterQuery<T> {
  if ('operator' in filter && 'filters' in filter) {
    return processComplexFilter<T>(filter);
  } else if ('from' in filter || 'to' in filter) {
    return processDateRangeFilter<T>(filter);
  } else if ('key' in filter && 'operator' in filter) {
    return processFilterField<T>(filter);
  } else {
    return {} as any;
  }
}

/**
 * Build a MongoDB query from filters
 */
export function buildQuery<T>(
  filters?: IPersistence.Filter<T> | null,
): FilterQuery<T> {
  // If no filters, return empty query
  if (!filters) {
    return {} as FilterQuery<T>;
  }

  // Process single filter
  return processFilter<T>(filters);
}

// Helper function to create a simple equals filter
// Overload 1: Typed field with IntelliSense
export function eq<T, K extends keyof T>(
  field: K,
  value: T[K],
): IPersistence.FilterField<T>;
// Overload 2: String field for nested paths
export function eq<T>(field: string, value: any): IPersistence.FilterField<T>;
// Implementation
export function eq<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.EQ, value };
}

// Helper function to create a simple not-equals filter
// Overload 1: Typed field with IntelliSense
export function ne<T, K extends keyof T>(
  field: K,
  value: T[K],
): IPersistence.FilterField<T>;
// Overload 2: String field for nested paths
export function ne<T>(field: string, value: any): IPersistence.FilterField<T>;
// Implementation
export function ne<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.NE, value };
}

// Helper function to create a date range filter
// Overload 1: Typed field with IntelliSense
export function dateRange<T>(
  field: keyof T,
  from?: Date | string,
  to?: Date | string,
): IPersistence.DateRangeFilter<T>;
// Overload 2: String field for nested paths
export function dateRange<T>(
  field: string,
  from?: Date | string,
  to?: Date | string,
): IPersistence.DateRangeFilter<T>;
// Implementation
export function dateRange<T>(
  field: keyof T | string,
  from?: Date | string,
  to?: Date | string,
): IPersistence.DateRangeFilter<T> {
  return { key: field, from, to };
}

// Helper function to create an AND filter
export function and<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.AND, filters };
}

// Helper function to create an OR filter
export function or<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.OR, filters };
}

// Helper function to create a NOR filter
export function nor<T>(
  ...filters: IPersistence.Filter<T>[]
): IPersistence.ComplexFilter<T> {
  return { operator: IPersistence.LogicalOperator.NOR, filters };
}

// Helper function to check if a field contains a string (case-insensitive)
// Overload 1: Typed field with IntelliSense
export function contains<T>(
  field: keyof T,
  value: string,
): IPersistence.FilterField<T>;
// Overload 2: String field for nested paths
export function contains<T>(
  field: string,
  value: string,
): IPersistence.FilterField<T>;
// Implementation
export function contains<T>(
  field: keyof T | string,
  value: string,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.CONTAINS, value };
}

// Helper function to create an IN filter
export function inArray<T>(
  field: keyof T | string,
  values: any[],
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.IN,
    value: values,
  };
}

// Helper function to create a NOT IN filter
export function ninArray<T>(
  field: keyof T | string,
  values: any[],
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.NIN,
    value: values,
  };
}

// Helper function to create a greater than filter
export function gt<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.GT, value };
}

// Helper function to create a greater than or equal filter
export function gte<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.GTE, value };
}

// Helper function to create a less than filter
export function lt<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.LT, value };
}

// Helper function to create a less than or equal filter
export function lte<T>(
  field: keyof T | string,
  value: any,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.LTE, value };
}

// Helper function to create an exists filter
export function exists<T>(
  field: keyof T | string,
  value: boolean = true,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.EXISTS, value };
}

// Helper function to create a starts with filter
export function startsWith<T>(
  field: keyof T | string,
  value: string,
): IPersistence.FilterField<T> {
  return {
    key: field,
    operator: IPersistence.FilterOperator.STARTS_WITH,
    value,
  };
}

// Helper function to create an ends with filter
export function endsWith<T>(
  field: keyof T | string,
  value: string,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.ENDS_WITH, value };
}

// Helper function to create a regex filter
export function regex<T>(
  field: keyof T | string,
  value: string,
): IPersistence.FilterField<T> {
  return { key: field, operator: IPersistence.FilterOperator.REGEX, value };
}

// near
// export function near<T>(
//   field: keyof T & string,
//   coordinates: GeolibInputCoordinates,
//   maxDistance: number,
// ): IPersistence.FilterField<T> {
//   return {
//     key: field,
//     operator: IPersistence.FilterOperator.NEAR,
//     value: {
//       coordinates,
//       maxDistance,
//     },
//   };
// }
