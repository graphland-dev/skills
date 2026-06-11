import * as React from 'react'
import { CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react'

import { FormFieldShell, useFormFieldIds } from './form-field-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import type {
  FormFieldBaseProps,
  FormFieldCreateComponentProps,
  FormFieldOption,
} from './types'

export type FormFieldSelectComboboxProps = FormFieldBaseProps & {
  options: FormFieldOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  createLabel?: string
  createSheetTitle?: string
  createSheetDescription?: string
  createComponent?: React.ComponentType<FormFieldCreateComponentProps>
}

export function FormFieldSelectCombobox({
  id,
  label,
  description,
  error,
  required,
  requiredTooltip,
  info,
  disabled,
  orientation,
  className,
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  createLabel = 'Create new',
  createSheetTitle,
  createSheetDescription,
  createComponent: CreateComponent,
}: FormFieldSelectComboboxProps) {
  const { fieldId, descriptionId, errorId, getAriaDescribedBy } =
    useFormFieldIds(id)

  const [open, setOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options

    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    )
  }, [options, search])

  function handleSelect(nextValue: string) {
    onValueChange?.(nextValue)
    setOpen(false)
    setSearch('')
  }

  function handleCreateClick() {
    setOpen(false)
    setCreateOpen(true)
  }

  function handleCreated(option: { value: string; label: string }) {
    onValueChange?.(option.value)
    setCreateOpen(false)
    setSearch('')
  }

  return (
  <>
    <FormFieldShell
      label={label}
      description={description}
      error={error}
      required={required}
      requiredTooltip={requiredTooltip}
      info={info}
      disabled={disabled}
      orientation={orientation}
      className={className}
      fieldId={fieldId}
      descriptionId={descriptionId}
      errorId={errorId}
    >
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setSearch('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error || undefined}
            aria-describedby={getAriaDescribedBy(description, error)}
            disabled={disabled}
            className={cn(
              'h-9 w-full justify-between px-2.5 font-normal',
              !selectedOption && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <div className="flex flex-col gap-1 p-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 border-0 shadow-none focus-visible:ring-0"
              aria-label={searchPlaceholder}
            />
            <Separator />
            <div
              role="listbox"
              aria-label={label}
              className="max-h-56 overflow-y-auto p-1"
            >
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-foreground/10 focus:bg-foreground/10 disabled:pointer-events-none disabled:opacity-50',
                        isSelected && 'bg-foreground/10',
                      )}
                    >
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected ? (
                        <CheckIcon className="size-4 shrink-0" />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
            {CreateComponent ? (
              <>
                <Separator />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleCreateClick}
                >
                  <PlusIcon className="size-4" />
                  {createLabel}
                </Button>
              </>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </FormFieldShell>

    {CreateComponent ? (
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{createSheetTitle ?? createLabel}</SheetTitle>
            {createSheetDescription ? (
              <SheetDescription>{createSheetDescription}</SheetDescription>
            ) : null}
          </SheetHeader>
          <CreateComponent
            onClose={() => setCreateOpen(false)}
            onCreated={handleCreated}
          />
        </SheetContent>
      </Sheet>
    ) : null}
  </>
  )
}
