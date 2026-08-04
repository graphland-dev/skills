# Pagination — PaginationQueryDto + PaginatedResponseDto

## The contract

Every list endpoint speaks the same shape, so frontends (and the GraphLand frontend `DataTable`) can wire any list identically.

**Request** (`templates/common/pagination.dto.ts`):

```ts
export class PaginationQueryDto {
  page?: number = 1;    // 1-indexed, @Min(1)
  limit?: number = 20;  // @Min(1) @Max(100) — hard cap, never trust client limits
}
```

Feature list queries extend it with their filters:

```ts
export class EntityListQueryDto extends PaginationQueryDto {
  status?: EntityStatus;   // @IsEnum
}
```

**API response** (what the controller returns, what the frontend `DataTable` consumes):

```ts
{
  data: EntityResponseDto[],
  meta: { page, limit, total, totalPages }
}
```

Each feature declares a concrete `PaginatedEntitiesResponseDto` (typed `data` + `PaginationMetaDto`) so Swagger emits exact schemas — the generic `PaginatedResponseDto<T>` exists for internal typing, but generics don't survive Swagger.

## Two pagination shapes — don't confuse them

`PersistenceRepositoryService.findAllWithPagination()` (see [persistence.md](persistence.md)) returns an **`AppPaginationResponseDto`**, whose `meta` uses different field names:

```ts
{
  data: DOCUMENT_TYPE[],
  meta: {
    currentPage: number,
    hasNextPage: boolean,
    totalCount: number,
    totalPages: number,
  },
}
```

This is the repository-level shape — it is *not* what the controller returns. The service is always responsible for mapping it to the API-facing `{ page, limit, total, totalPages }` shape:

```ts
// repository (inherited from PersistenceRepositoryService, nothing to write)
const result = await this.entityRepository.findAllWithPagination({
  where: and(eq('organizationId', organizationId), eq('status', query.status)),
  pagination: { page: query.page, limit: query.limit, sortBy: 'createdAt' },
});

// service — map AppPaginationResponseDto.meta -> API meta
return {
  data: result.data.map((d) => this.toResponse(d)),
  meta: {
    page: result.meta.currentPage,
    limit: query.limit ?? 20,
    total: result.meta.totalCount,
    totalPages: result.meta.totalPages,
  },
};
```

`limit: -1` fetches every matching document unpaginated (`hasNextPage: false`, `totalPages: 1`) — used for internal bulk reads (e.g. `findTrialsExpiredBefore` in a cron job), never wired to a public list endpoint.

## Conventions

- `page` is 1-indexed everywhere (URL, API, repository, frontend `DataTable` prop).
- The org filter is always part of `where` — pagination never leaks across tenants ([auth.md](auth.md)).
- Default sort is `createdAt: -1` (newest first) via `pagination.sortBy`/`pagination.sort` — no need to hand-roll `.sort().skip().limit()`, the base class does it.
- Filtering: build `where` with the query-builder DSL (`eq`, `contains`, `and`, ...) from [persistence.md](persistence.md) — e.g. `contains('name', query.search)` for a case-insensitive search, not a hand-rolled `$regex`.
- Frontend mapping: the API `meta` feeds `DataTable`'s `totalCount`/`totalPages` props directly (frontend guideline → `references/data-table.md`).
