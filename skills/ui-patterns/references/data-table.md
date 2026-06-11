# Data Table — ReUI DataGrid + URL-synced state

## Why this pattern

Every list page uses [ReUI's DataGrid](https://reui.io/docs/data-grid) (shadcn-registry component built on TanStack Table) composed natively: the page builds the `useReactTable` instance and passes it to `<DataGrid>`. All list state — page, page size, sort, search, filters — lives in **URL search params**, making lists shareable, bookmarkable, and reload-safe. The grid runs in TanStack's manual modes; the URL drives the server query.

```
URL search params ──▶ state: { sorting, pagination } + buildPaginationParams() ──▶ server query
        ▲                                                                              │
        └── onSortingChange / onPaginationChange / toolbar callbacks ◀── DataGrid ◀────┘ data
```

## Install

```
npx shadcn@latest add @reui/data-grid @reui/data-grid-table @reui/data-grid-pagination \
  @reui/data-grid-scroll-area @reui/data-grid-column-header @reui/data-grid-column-visibility
```

Files land in `src/components/reui/data-grid/` and stay updatable from the registry — never fork them. The plugin adds two pieces ReUI doesn't ship: `templates/table/data-grid-toolbar.tsx` (debounced search, refresh, filter slot, columns toggle) and `templates/table/table-utils.ts` (URL ↔ backend/TanStack bridges).

## Composition (full wiring: `templates/example-module/index.tsx`)

```tsx
// 1. Derive TanStack state from URL params
const sorting = useMemo(() => sortParamToSortingState(sp.sort), [sp.sort]);
const pagination = useMemo<PaginationState>(
  () => ({ pageIndex: (sp.page ?? 1) - 1, pageSize: sp.pageSize ?? 10 }),
  [sp.page, sp.pageSize],
);

// 2. Manual-mode table; change handlers write back to the URL
const table = useReactTable({
  columns,
  data: nodes,
  getCoreRowModel: getCoreRowModel(),
  getRowId: (row) => row._id,
  manualSorting: true,
  manualPagination: true,
  pageCount: meta?.totalPages ?? 0,
  state: { sorting, pagination },
  onSortingChange: (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    navigate({ search: { ...sp, sort: sortingStateToSortParam(next), page: 1 }, replace: true });
  },
  onPaginationChange: (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    navigate({ search: { ...sp, page: next.pageIndex + 1, pageSize: next.pageSize }, replace: true });
  },
});

// 3. Compose
<DataGrid table={table} recordCount={meta?.totalCount ?? 0}
  isLoading={query.isLoading} loadingMode="skeleton"
  emptyMessage="No entities found." tableLayout={{ columnsVisibility: true }}>
  <div className="w-full space-y-2.5">
    <DataGridToolbar searchValue={sp.search} onSearchChange={...} onRefresh={...} filterButton={...} />
    <DataGridContainer>
      <DataGridScrollArea>
        <DataGridTable />
      </DataGridScrollArea>
    </DataGridContainer>
    <DataGridPagination />
  </div>
</DataGrid>
```

## Column conventions (native TanStack `ColumnDef<T>`)

- **`id` doubles as the backend sort key.** With `accessorKey: "name"` the id is implicit; with `accessorFn` (nested/computed values) set `id` explicitly to the server field (e.g. `accessorFn: (r) => r.client?.name, id: "client"`).
- Sortable columns: `enableSorting: true` + `header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />` (renders sort indicators + pin/visibility dropdown).
- Actions column: `{ id: "actions", enableSorting: false, enableHiding: false, cell: ({ row }) => <…Edit/Delete buttons…> }`, with `e.stopPropagation()` in handlers if `onRowClick` is set.
- `getRowId: (row) => row._id` keeps selection/pinning stable across refetches.
- Searchable columns are not a column flag anymore: keep a plain `searchableColumns: string[]` fed to `buildPaginationParams` (search is a server-side OR filter).

## Toolbar and URL conventions

`DataGridToolbar` must render **inside** `<DataGrid>` (it uses the grid context for the columns-visibility dropdown). It debounces search 500ms with a typing guard so URL syncing doesn't fight the input. The `filterButton` slot pairs with a FilterSheet ([sheets.md](sheets.md)).

| Param | Format | Example |
| --- | --- | --- |
| `page`, `pageSize` | numbers (1-indexed in URL; TanStack `pageIndex` is 0-based) | `?page=2&pageSize=25` |
| `sort` | `column:asc` / `column:desc` | `?sort=name:asc` |
| `search` | plain string | `?search=acme` |
| filters | one param per filter | `?filterCategory=<id>` |

Every state change resets `page` to 1 except pagination itself.

## table-utils.ts

`templates/table/table-utils.ts` provides both bridges:
- `buildPaginationParams(sp, searchableColumns)` → backend `CommonPaginationDto` (`{ page, limit, sortBy?, sort?, filters? }`); ships standalone `MatchOperator`/`SortType`/`CommonFindDocumentDto` (re-point at generated types if the project has codegen).
- `sortParamToSortingState` / `sortingStateToSortParam` → TanStack `SortingState` ↔ URL `sort` param.

## Extra DataGrid capabilities (enable per table as needed)

`tableLayout` flags: `columnsResizable`, `columnsPinnable`, `columnsMovable`, `headerSticky`, `dense`, `stripped`, row pinning/drag. `DataGridTableVirtual` replaces `DataGridTable` for huge client-side datasets. Default GraphLand setup enables only `columnsVisibility`.

## Adaptation

- **Router**: only the URL read/write changes — same swaps as everywhere ([adaptation.md](adaptation.md)): Next.js `useSearchParams` + `router.replace`, React Router `setSearchParams`. The derive-state/manual-mode wiring is identical.
- **REST backend**: keep the TanStack state derivation; map URL params to your API's query-string shape instead of `buildPaginationParams`.
- **Client-side data**: drop the manual flags and add `getSortedRowModel()`/`getPaginationRowModel()`; state can stay local instead of URL for throwaway tables.
