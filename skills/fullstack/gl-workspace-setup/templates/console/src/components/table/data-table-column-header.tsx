import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'
import type { Column } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn('font-medium', className)}>{title}</span>
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('-ml-2 h-8 font-medium', className)}
      onClick={column.getToggleSortingHandler()}
    >
      {title}
      {sorted === 'asc' ? (
        <ChevronUpIcon className="size-4" />
      ) : sorted === 'desc' ? (
        <ChevronDownIcon className="size-4" />
      ) : (
        <ArrowUpDownIcon className="size-4 text-muted-foreground" />
      )}
    </Button>
  )
}
