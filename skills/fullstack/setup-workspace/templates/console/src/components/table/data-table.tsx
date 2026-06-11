import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'

import {
  countColumnFilters,
  DataTableColumnFilters,
} from '@/components/table/data-table-column-filters'
import { DataTableColumnHeader } from '@/components/table/data-table-column-header'
import { DataTableFilter } from '@/components/table/data-table-filter'
import { DataTablePagination } from '@/components/table/data-table-pagination'
import { DataTableSkeleton } from '@/components/table/data-table-skeleton'
import { DataTableToolbar } from '@/components/table/data-table-toolbar'
import {
  getColumnMeta,
  getFilterableColumns,
  getSearchableColumnCount,
  normalizeDataTableColumns,
} from '@/components/table/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  pageSize?: number
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  filterTitle?: string
  filterDescription?: string
  filterContent?: React.ReactNode
  activeFilterCount?: number
  onFilterApply?: () => void
  onFilterReset?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  onDownload?: () => void
  downloadLabel?: string
  getRowId?: (row: TData) => string
}

function withSortableHeaders<TData>(
  columns: ColumnDef<TData, unknown>[],
): ColumnDef<TData, unknown>[] {
  return columns.map((column) => {
    const meta = getColumnMeta(column)

    if (!meta.sortable || typeof column.header !== 'string') {
      return column
    }

    const title = column.header

    return {
      ...column,
      header: ({ column: tableColumn }) => (
        <DataTableColumnHeader column={tableColumn} title={title} />
      ),
    } as ColumnDef<TData, unknown>
  })
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pageSize = 10,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  filterTitle = 'Filters',
  filterDescription,
  filterContent,
  activeFilterCount = 0,
  onFilterApply,
  onFilterReset,
  onRefresh,
  isRefreshing,
  onDownload,
  downloadLabel,
  getRowId,
}: DataTableProps<TData>) {
  const normalizedColumns = React.useMemo(
    () => withSortableHeaders(normalizeDataTableColumns(columns)),
    [columns],
  )

  const filterableColumns = React.useMemo(
    () => getFilterableColumns(columns),
    [columns],
  )

  const searchableColumnCount = React.useMemo(
    () => getSearchableColumnCount(columns),
    [columns],
  )

  const [globalFilter, setGlobalFilter] = React.useState('')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [draftColumnFilters, setDraftColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [filterOpen, setFilterOpen] = React.useState(false)

  const table = useReactTable({
    data,
    columns: normalizedColumns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    getRowId,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const hasColumnFilters = filterableColumns.length > 0
  const hasCustomFilters = Boolean(filterContent)
  const showFilter = hasColumnFilters || hasCustomFilters
  const totalActiveFilterCount =
    countColumnFilters(columnFilters) + activeFilterCount

  function handleFilterOpenChange(open: boolean) {
    setFilterOpen(open)

    if (open) {
      setDraftColumnFilters(columnFilters)
    }
  }

  function handleFilterApply() {
    setColumnFilters(draftColumnFilters)
    onFilterApply?.()
    setFilterOpen(false)
  }

  function handleFilterReset() {
    setDraftColumnFilters([])
    setColumnFilters([])
    onFilterReset?.()
  }

  const showToolbar =
    searchableColumnCount > 0 ||
    showFilter ||
    Boolean(onRefresh || onDownload)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {showToolbar ? (
        <DataTableToolbar
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          searchPlaceholder={searchPlaceholder}
          showSearch={searchableColumnCount > 0}
          activeFilterCount={totalActiveFilterCount}
          onFilterClick={
            showFilter ? () => handleFilterOpenChange(true) : undefined
          }
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onDownload={onDownload}
          downloadLabel={downloadLabel}
        />
      ) : null}

      {isLoading ? (
        <DataTableSkeleton
          columnCount={normalizedColumns.length}
          rowCount={pageSize}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={normalizedColumns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading ? <DataTablePagination table={table} /> : null}

      {showFilter ? (
        <DataTableFilter
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
          title={filterTitle}
          description={filterDescription}
          activeCount={totalActiveFilterCount}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
        >
          <div className="flex flex-col gap-6">
            {hasColumnFilters ? (
              <DataTableColumnFilters
                table={table}
                columns={filterableColumns}
                draftFilters={draftColumnFilters}
                onDraftFiltersChange={setDraftColumnFilters}
              />
            ) : null}
            {filterContent}
          </div>
        </DataTableFilter>
      ) : null}
    </div>
  )
}
