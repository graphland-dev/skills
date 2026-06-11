import type { ColumnDef, ColumnFiltersState, Table } from '@tanstack/react-table'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  getColumnMeta,
  type DataTableFilterOption,
} from './types'

function getColumnId<TData>(column: ColumnDef<TData, unknown>) {
  if ('id' in column && column.id) return column.id
  if ('accessorKey' in column && column.accessorKey) {
    return String(column.accessorKey)
  }

  return ''
}

function getColumnLabel<TData>(column: ColumnDef<TData, unknown>) {
  const meta = getColumnMeta(column)

  if (meta.filterLabel) return meta.filterLabel

  if (typeof column.header === 'string') return column.header

  return getColumnId(column)
}

function getFilterOptions<TData>(
  column: ColumnDef<TData, unknown>,
  table: Table<TData>,
): DataTableFilterOption[] {
  const meta = getColumnMeta(column)

  if (meta.filterOptions?.length) {
    return meta.filterOptions
  }

  const columnId = getColumnId(column)
  if (!columnId) return []

  const values = new Set<string>()

  for (const row of table.getCoreRowModel().rows) {
    const value = row.getValue(columnId)
    if (value != null && value !== '') {
      values.add(String(value))
    }
  }

  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      label: value,
      value,
    }))
}

type DataTableColumnFiltersProps<TData> = {
  table: Table<TData>
  columns: ColumnDef<TData, unknown>[]
  draftFilters: ColumnFiltersState
  onDraftFiltersChange: (filters: ColumnFiltersState) => void
}

export function DataTableColumnFilters<TData>({
  table,
  columns,
  draftFilters,
  onDraftFiltersChange,
}: DataTableColumnFiltersProps<TData>) {
  const filterableColumns = columns.filter(
    (column) => getColumnMeta(column).filterable,
  )

  if (filterableColumns.length === 0) {
    return null
  }

  function updateDraftFilter(columnId: string, value: string) {
    const nextFilters = draftFilters.filter((filter) => filter.id !== columnId)

    if (value !== 'all') {
      nextFilters.push({ id: columnId, value })
    }

    onDraftFiltersChange(nextFilters)
  }

  return (
    <div className="flex flex-col gap-4">
      {filterableColumns.map((column) => {
        const columnId = getColumnId(column)
        const label = getColumnLabel(column)
        const options = getFilterOptions(column, table)
        const currentValue =
          draftFilters.find((filter) => filter.id === columnId)?.value ?? 'all'

        return (
          <div key={columnId} className="space-y-2">
            <Label htmlFor={`filter-${columnId}`}>{label}</Label>
            <Select
              value={String(currentValue)}
              onValueChange={(value) => updateDraftFilter(columnId, value)}
            >
              <SelectTrigger id={`filter-${columnId}`} className="w-full">
                <SelectValue placeholder={`All ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}

export function countColumnFilters(filters: ColumnFiltersState) {
  return filters.filter(
    (filter) =>
      filter.value != null && filter.value !== '' && filter.value !== 'all',
  ).length
}
