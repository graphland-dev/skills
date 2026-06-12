import * as React from 'react'

import { FormFieldShell, useFormFieldIds } from './form-field-shell'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import type { FormFieldBaseProps, FormFieldOption } from './types'

export type FormFieldRadioGroupProps = FormFieldBaseProps &
  Omit<
    React.ComponentProps<typeof RadioGroup>,
    'id' | 'children' | 'aria-invalid' | 'aria-describedby'
  > & {
    options: FormFieldOption[]
  }

export function FormFieldRadioGroup({
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
  ...radioGroupProps
}: FormFieldRadioGroupProps) {
  const { fieldId, descriptionId, errorId, getAriaDescribedBy } =
    useFormFieldIds(id)

  return (
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
      <RadioGroup
        data-slot="radio-group"
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={getAriaDescribedBy(description, error)}
        {...radioGroupProps}
      >
        {options.map((option) => {
          const optionId = `${fieldId}-${option.value}`

          return (
            <div
              key={option.value}
              className={cn(
                'flex items-start gap-3',
                option.disabled && 'opacity-50',
              )}
            >
              <RadioGroupItem
                id={optionId}
                value={option.value}
                disabled={disabled || option.disabled}
                aria-invalid={!!error || undefined}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <Label htmlFor={optionId} className="font-normal">
                  {option.label}
                </Label>
                {option.description ? (
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </RadioGroup>
    </FormFieldShell>
  )
}
