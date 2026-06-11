import { InfoIcon } from 'lucide-react'
import * as React from 'react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { FormFieldBaseProps } from './types'

type FormFieldShellProps = FormFieldBaseProps & {
  children: React.ReactNode
  fieldId: string
  descriptionId?: string
  errorId?: string
}

export function FormFieldShell({
  label,
  description,
  error,
  required,
  requiredTooltip = 'Required',
  info,
  disabled,
  orientation,
  className,
  children,
  fieldId,
  descriptionId,
  errorId,
}: FormFieldShellProps) {
  return (
    <Field
      orientation={orientation}
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={className}
    >
      <FieldLabel htmlFor={fieldId}>
        {label}
        {required ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label={requiredTooltip}
                className="cursor-help text-destructive"
              >
                *
              </span>
            </TooltipTrigger>
            <TooltipContent>{requiredTooltip}</TooltipContent>
          </Tooltip>
        ) : null}
        {info ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label={info}
                className="inline-flex cursor-help text-muted-foreground"
              >
                <InfoIcon className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{info}</TooltipContent>
          </Tooltip>
        ) : null}
      </FieldLabel>
      <FieldContent>
        {children}
        {description ? (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        ) : null}
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  )
}

export function useFormFieldIds(id?: string) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId

  return {
    fieldId,
    descriptionId: `${fieldId}-description`,
    errorId: `${fieldId}-error`,
    getAriaDescribedBy: (description?: string, error?: string) =>
      cn(
        description && `${fieldId}-description`,
        error && `${fieldId}-error`,
      ) || undefined,
  }
}
