import { DownloadIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'

import { DataTableFilterTrigger } from '@/components/table/data-table-filter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DataTableToolbarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  activeFilterCount?: number
  onFilterClick?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  onDownload?: () => void
  downloadLabel?: string
  filterSlot?: React.ReactNode
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  activeFilterCount = 0,
  onFilterClick,
  onRefresh,
  isRefreshing = false,
  onDownload,
  downloadLabel = 'Download CSV',
  filterSlot,
}: DataTableToolbarProps) {
  const hasActions = Boolean(onRefresh || onFilterClick || onDownload || filterSlot)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center',
        showSearch ? 'sm:justify-between' : 'sm:justify-end',
      )}
    >
      {showSearch ? (
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}
      {hasActions ? (
        <div className="flex items-center gap-2">
          {filterSlot}
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCwIcon
                className={cn('size-4', isRefreshing && 'animate-spin')}
              />
              Refresh
            </Button>
          ) : null}
          {onFilterClick ? (
            <DataTableFilterTrigger
              activeCount={activeFilterCount}
              onClick={onFilterClick}
            />
          ) : null}
          {onDownload ? (
            <Button type="button" variant="outline" onClick={onDownload}>
              <DownloadIcon className="size-4" />
              {downloadLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
