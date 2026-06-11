import type { ColumnDef, FilterFn, Row } from '@tanstack/react-table'

export type DataTableFilterOption = {
  label: string
  value: string
}

export type DataTableColumnMeta = {
  /** Include this column in the toolbar search. Defaults to true when an accessor is set. */
  searchable?: boolean
  /** Enable click-to-sort on the column header. */
  sortable?: boolean
  /** Show this column in the filter sheet. */
  filterable?: boolean
  /** Label used in the auto-generated filter field. */
  filterLabel?: string
  /** Options for select-based column filters. Unique values are inferred when omitted. */
  filterOptions?: DataTableFilterOption[]
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    searchable?: boolean
    sortable?: boolean
    filterable?: boolean
    filterLabel?: string
    filterOptions?: DataTableFilterOption[]
  }
}

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>

export type DataTablePaginationState = {
  pageIndex: number
  pageSize: number
}

export function getColumnMeta<TData>(
  columnDef: ColumnDef<TData, unknown>,
): DataTableColumnMeta {
  return columnDef.meta ?? {}
}

export function columnFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
) {
  if (filterValue == null || filterValue === '' || filterValue === 'all') {
    return true
  }

  return String(row.getValue(columnId)) === String(filterValue)
}

export const dataTableColumnFilterFn: FilterFn<unknown> = (
  row,
  columnId,
  filterValue,
) => columnFilterFn(row, columnId, filterValue)

export function normalizeDataTableColumns<TData>(
  columns: DataTableColumn<TData>[],
): DataTableColumn<TData>[] {
  return columns.map((column) => {
    const meta = getColumnMeta(column)
    const hasAccessor = 'accessorKey' in column && column.accessorKey != null

    return {
      ...column,
      enableSorting: meta.sortable ?? column.enableSorting ?? false,
      enableGlobalFilter:
        meta.searchable ?? column.enableGlobalFilter ?? hasAccessor,
      enableColumnFilter:
        meta.filterable ?? column.enableColumnFilter ?? false,
      filterFn:
        meta.filterable && !column.filterFn
          ? dataTableColumnFilterFn
          : column.filterFn,
    }
  }) as DataTableColumn<TData>[]
}

export function getFilterableColumns<TData>(
  columns: DataTableColumn<TData>[],
) {
  return normalizeDataTableColumns(columns).filter(
    (column) => getColumnMeta(column).filterable,
  )
}

export function getSearchableColumnCount<TData>(
  columns: DataTableColumn<TData>[],
) {
  return normalizeDataTableColumns(columns).filter(
    (column) => column.enableGlobalFilter !== false,
  ).length
}
