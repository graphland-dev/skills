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
  search?: string;         // case-insensitive name regex
}
```

**Response**:

```ts
{
  data: EntityResponseDto[],
  meta: { page, limit, total, totalPages }
}
```

Each feature declares a concrete `PaginatedEntitiesResponseDto` (typed `data` + `PaginationMetaDto`) so Swagger emits exact schemas — the generic `PaginatedResponseDto<T>` exists for internal typing, but generics don't survive Swagger.

## Service/repository split

The repository runs the two-query pattern (page + count) in parallel; the service builds the filter and assembles the meta:

```ts
// repository
const [data, total] = await Promise.all([
  this.entityModel.find(filter).sort({ createdAt: -1 })
    .skip((page - 1) * limit).limit(limit).exec(),
  this.entityModel.countDocuments(filter).exec(),
]);

// service
return {
  data: data.map((d) => this.toResponse(d)),
  meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
};
```

Default sort is `createdAt: -1` (newest first). Back the common list filter with a compound index: `{ organizationId: 1, createdAt: -1 }` (see `templates/example-module/entities/entity.entity.ts`).

## Conventions

- `page` is 1-indexed everywhere (URL, API, frontend `DataTable` prop).
- The org filter is always part of the query — pagination never leaks across tenants ([auth.md](auth.md)).
- Search = `{ name: { $regex: query.search, $options: 'i' } }` for simple cases; add a text index when fields multiply.
- Frontend mapping: this `meta` feeds `DataTable`'s `totalCount`/`totalPages` props directly (frontend guideline → `references/data-table.md`).
