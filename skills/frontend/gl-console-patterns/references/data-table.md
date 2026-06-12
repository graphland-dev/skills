# Data Table — `DataTable` (ReUI DataGrid wrapper) + URL-synced state

## Why this pattern

Every list page uses GraphLand's **`DataTable`** (`templates/table/data-table.tsx`) — a thin wrapper over [ReUI's DataGrid](https://reui.io/docs/data-grid) exposing our own prop API. Call sites import only `DataTable` + `ColumnDef` from `@/components/table/data-table`; they never touch ReUI or `@tanstack/react-table`. The wrapper is **controlled**: server-side page/sort/search are props with `on*Change` callbacks, and all list state lives in **URL search params** (shareable, bookmarkable, reload-safe). The page maps params ↔ URL; the wrapper owns the ReUI/TanStack composition.

```
URL search params ──▶ DataTable props (page/sort/search) + buildPaginationParams() ──▶ server query
        ▲                                                                                  │
        └──────────── onPaginationChange / onSortChange / onSearchChange ◀── DataTable ◀───┘ data
```

## Install

ReUI DataGrid is a peer the wrapper imports — `gl-console-foundation` installs it from the registry:

```
npx shadcn@latest add @reui/data-grid @reui/data-grid-table @reui/data-grid-pagination \
  @reui/data-grid-scroll-area @reui/data-grid-column-header @reui/data-grid-column-visibility
```

Files land in `src/components/reui/data-grid/` (updatable from the registry — never fork). The plugin's `table-utils.ts` provides the URL↔backend/TanStack bridges the wrapper uses internally.

## Prop API

```tsx
<DataTable
  columns={columns}            // GraphLand ColumnDef<T>[]
  data={nodes}
  getRowId={(row) => row._id}
  // server-side state (controlled, from URL)
  totalCount={meta.totalCount}
  totalPages={meta.totalPages}
  page={sp.page ?? 1}          // 1-indexed
  pageSize={sp.pageSize ?? 10}
  onPaginationChange={(page, pageSize) => navigate({ search: { ...sp, page, pageSize }, replace: true })}
  sort={sp.sort}               // "key:asc" | "key:desc"
  onSortChange={(sort) => navigate({ search: { ...sp, sort, page: 1 }, replace: true })}
  searchValue={sp.search}
  onSearchChange={(term) => navigate({ search: { ...sp, search: term || undefined, page: 1 }, replace: true })}
  onRefresh={() => queryClient.invalidateQueries({ queryKey: ["entities"] })}
  filterButton={<Button onClick={() => setFilterOpen(true)}>Filter</Button>}
  loading={query.isLoading}
  emptyMessage="No entities found."
  actions={(row) => <>{/* Edit / Delete buttons */}</>}
/>
```

Other props: `onRowClick`, `columnsVisibility` (default true), `toolbar` (extra left-side content), `tableLayout` (escape hatch → ReUI flags: `columnsResizable`, `columnsPinnable`, `columnsMovable`, `headerSticky`, `dense`, `stripped`, …). Omitting `onSearchChange` hides the search box; omitting `onRefresh` hides the refresh button.

## Column conventions (`ColumnDef<T>`)

```ts
interface ColumnDef<T> {
  accessor: string | ((row: T) => unknown); // "name", "user.name", or a getter
  title: string;
  sortable?: boolean;
  sortKey?: string;   // backend sort key; required for sortable fn-accessor columns
  cell?: ({ row, value }) => ReactNode;
  align?: "left" | "right" | "center";
  width?: number;
  hideable?: boolean; // default true
}
```

- **Sorting maps to the backend field**: a string `accessor` (e.g. `"name"`) is the sort key by default; for a function accessor or a display name that differs from the server field, set `sortKey` (e.g. `accessor: (r) => r.client?.name, sortKey: "client"`).
- Actions go through the `actions` render prop, not a column — the wrapper appends a non-sortable, non-hideable trailing column. Use `e.stopPropagation()` in handlers if `onRowClick` is set.
- Searchable columns are not a column flag: pass a plain `searchableColumns: string[]` to `buildPaginationParams` (search is a server-side OR filter).
- Row types must be **type aliases**, not interfaces (the underlying grid constrains rows to `object`).

## URL conventions

| Param | Format | Example |
| --- | --- | --- |
| `page`, `pageSize` | numbers (1-indexed) | `?page=2&pageSize=25` |
| `sort` | `key:asc` / `key:desc` | `?sort=name:asc` |
| `search` | plain string | `?search=acme` |
| filters | one param per filter | `?filterCategory=<id>` |

Every state change resets `page` to 1 except pagination itself. Search is debounced 500ms inside the wrapper (with a typing guard so URL syncing doesn't fight the input).

## Under the hood

The wrapper builds `useReactTable` in manual mode (`manualSorting`/`manualPagination`, `pageCount: totalPages`), maps GraphLand columns to native TanStack columns (`accessorFn`, `id = sortKey ?? accessor`, ReUI `DataGridColumnHeader` for sortable headers, `meta.headerTitle` for the visibility menu), and assembles `DataGrid > DataGridContainer > DataGridScrollArea > DataGridTable` + an internal toolbar + `DataGridPagination`. You only edit `data-table.tsx` if you need to expose more ReUI capability; pages stay on the GraphLand API. `table-utils.ts` still exports `buildPaginationParams` (URL → backend `CommonPaginationDto`) plus the `sortParamToSortingState`/`sortingStateToSortParam` bridges the wrapper consumes.

## Adaptation

- **Router**: only the URL read/write in the `on*Change` callbacks changes ([adaptation.md](adaptation.md)) — Next.js `useSearchParams` + `router.replace`, React Router `setSearchParams`. The wrapper itself is router-agnostic.
- **REST backend**: keep `DataTable` as-is; map URL params to your API's query string instead of `buildPaginationParams`.
- **Client-side data**: for throwaway tables, pass local `useState` for page/sort/search instead of URL params, or compose ReUI directly with client row models — the wrapper targets the server-paginated case.
