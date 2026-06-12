import { FilterIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export type DataTableFilterProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  activeCount?: number
  children: React.ReactNode
  onApply?: () => void
  onReset?: () => void
}

export function DataTableFilter({
  open,
  onOpenChange,
  title = 'Filters',
  description,
  activeCount = 0,
  children,
  onApply,
  onReset,
}: DataTableFilterProps) {
  function handleApply() {
    onApply?.()
    onOpenChange(false)
  }

  function handleReset() {
    onReset?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {title}
            {activeCount > 0 ? ` (${activeCount})` : ''}
          </SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {children}
        </div>
        <SheetFooter className="flex-col gap-2 sm:justify-between">
          <Button type="button" onClick={handleApply}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-destructive"
            onClick={handleReset}
          >
            Reset
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type DataTableFilterTriggerProps = {
  activeCount?: number
  onClick: () => void
}

export function DataTableFilterTrigger({
  activeCount = 0,
  onClick,
}: DataTableFilterTriggerProps) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <FilterIcon className="size-4" />
      Filters
      {activeCount > 0 ? (
        <Badge variant="secondary" className="ml-1">
          {activeCount}
        </Badge>
      ) : null}
    </Button>
  )
}
