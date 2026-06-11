# Data Table — AppDataTable + URL-synced state

## Why this pattern

Every list page uses one table component (`templates/table/app-datatable.tsx`, built on TanStack Table + shadcn). All list state — page, page size, sort, search, filters — lives in **URL search params**, making lists shareable, bookmarkable, and reload-safe. The table itself is controlled: it only fires callbacks; the page writes state to the URL; the URL drives the query.

```
URL search params ──▶ buildPaginationParams() ──▶ server query (TanStack Query)
        ▲                                                  │
        └────── AppDataTable callbacks (onSortChange, …) ◀─┘ data
```

## ColumnDef

```tsx
interface ColumnDef<T> {
  accessor: string | ((row: T) => unknown); // "user.name" paths supported
  title: string;
  sortable?: boolean;
  sortKey?: string;        // server sort key when accessor is a function
  searchable?: boolean;    // include in global (debounced, 500ms) search
  width?: string | number;
  cell?: (props: { row: T; value: unknown }) => React.ReactNode;
  Filter?: (setValue: (key: string, value: unknown) => void) => React.ReactNode;
}
```

## Key props

- `data`, `columns`, `loading`, `emptyMessage`
- `paginationConfig: { pageSize, currentPage, totalItems }` — server-side pagination
- `searchValue` / `sortValue` — controlled values from URL params (`sortValue` is `"column:asc"`); they keep the table in sync after navigation and prevent duplicate callbacks
- `onSortChange(column, direction)`, `onSearchChange(term)`, `onPaginationChange(page, pageSize)`, `onRefresh()`
- `ActionColumn={(row) => <…edit/delete buttons…>}` — rendered as the last column
- `filterButton={<Button onClick={() => setIsFilterSheetOpen(true)}>…}` — custom toolbar button, usually opening a FilterSheet (see [sheets.md](sheets.md))

Full prop reference and basic examples: see the JSDoc in `templates/table/app-datatable.tsx`.

## URL conventions

| Param | Format | Example |
| --- | --- | --- |
| `page`, `pageSize` | numbers (1-indexed) | `?page=2&pageSize=25` |
| `sort` | `column:asc` / `column:desc` | `?sort=name:asc` |
| `search` | plain string | `?search=acme` |
| filters | one param per filter | `?filterCategory=<id>` |

Every state change resets `page` to 1 except pagination itself.

## table-utils.ts

`templates/table/table-utils.ts` converts URL params into the backend's `CommonPaginationDto` shape:

```ts
const params = buildPaginationParams(sp, ["name", "code"]); // searchable columns
// → { page, limit, sortBy?, sort?, filters? }  (search becomes an OR filter across columns)
```

It ships standalone copies of `MatchOperator`, `SortType`, and `CommonFindDocumentDto`; projects with GraphQL codegen should re-import those from generated types (noted at the top of the file).

## Adaptation

- **Router**: the table has no router dependency. Only the page wiring changes — TanStack Router uses `useSearch`/`navigate({ search })` with a Zod `validateSearch`; Next.js App Router uses `useSearchParams` + `router.replace` (parse params with the same Zod schema manually); React Router uses `useSearchParams`.
- **REST backend**: replace `buildPaginationParams` output mapping with your API's query-string shape (`?page=&limit=&sort=&q=`); keep the URL conventions identical so pages stay uniform.
- **Client-side data**: omit `paginationConfig` and the `on*Change` callbacks; the table paginates/sorts locally.
