// Standalone copies of the backend's pagination contract. If your project
// generates GraphQL types (codegen), replace these with:
//   import type { CommonFindDocumentDto } from "@/gql-types/graphql";
//   import { MatchOperator, SortType } from "@/gql-types/graphql";

export enum MatchOperator {
  Contains = "contains",
  Eq = "eq",
  Exists = "exists",
  Gt = "gt",
  Gte = "gte",
  In = "in",
  Lt = "lt",
  Lte = "lte",
  Ne = "ne",
  Nin = "nin",
}

export enum SortType {
  Asc = "ASC",
  Desc = "DESC",
}

export type CommonFindDocumentDto = {
  and?: CommonFindDocumentDto[] | null;
  key?: string | null;
  operator?: MatchOperator | null;
  or?: CommonFindDocumentDto[] | null;
  value?: string | null;
};

/**
 * Helper to parse sort from URL (format: "column:asc" or "column:desc")
 */
export function parseSort(sort?: string): { sortBy?: string; sort?: SortType } {
  if (!sort) return {};
  const [sortBy, direction] = sort.split(":");
  if (!sortBy || !direction) return {};
  return {
    sortBy,
    sort: direction.toUpperCase() === "ASC" ? SortType.Asc : SortType.Desc,
  };
}

/**
 * Helper to parse filter from URL (format: "column:value")
 */
export function parseFilter(filter?: string): CommonFindDocumentDto[] | undefined {
  if (!filter) return undefined;
  const [key, value] = filter.split(":");
  if (!key || !value) return undefined;
  return [
    {
      key,
      operator: MatchOperator.Contains,
      value,
    },
  ];
}

/**
 * Helper to parse search term and create filters for searchable columns
 * Returns array of filters that should be combined with OR logic
 */
export function parseSearch(
  search?: string,
  searchableColumns?: string[],
): CommonFindDocumentDto[] | undefined {
  if (!search || !search.trim() || !searchableColumns || searchableColumns.length === 0) {
    return undefined;
  }

  const searchTerm = search.trim();

  // Create filters for each searchable column
  return searchableColumns.map((key) => ({
    key,
    operator: MatchOperator.Contains,
    value: searchTerm,
  }));
}

/**
 * Helper to build pagination params for GraphQL queries
 */
export function buildPaginationParams(
  sp: {
    sort?: string;
    filter?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
  searchableColumns?: string[],
) {
  const { sortBy, sort } = parseSort(sp.sort);
  const filters = parseFilter(sp.filter);
  const searchFilters = parseSearch(sp.search, searchableColumns);

  // Combine filters and search filters
  const allFilters: CommonFindDocumentDto[] = [];

  if (filters) {
    allFilters.push(...filters);
  }

  // Add search filters - wrap multiple search filters in OR condition
  if (searchFilters) {
    if (searchFilters.length === 1) {
      // Single search filter, just add it
      allFilters.push(searchFilters[0]);
    } else if (searchFilters.length > 1) {
      // Multiple search filters - wrap in OR condition
      allFilters.push({
        or: searchFilters,
      });
    }
  }

  // If we have search filters and they need to be OR'd with regular filters,
  // we might need filterOperator, but let's try without first
  // The OR wrapper should handle the search filter logic

  return {
    page: sp.page || 1,
    limit: sp.pageSize || 10,
    ...(sortBy && sort && { sortBy, sort }),
    ...(allFilters.length > 0 && { filters: allFilters }),
  };
}
