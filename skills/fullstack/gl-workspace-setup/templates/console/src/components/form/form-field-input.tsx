import * as React from 'react'

import { FormFieldShell, useFormFieldIds } from './form-field-shell'
import { Input } from '@/components/ui/input'

import type { FormFieldBaseProps } from './types'

export type FormFieldInputProps = FormFieldBaseProps &
  Omit<React.ComponentProps<typeof Input>, 'id'>

export function FormFieldInput({
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
  ...inputProps
}: FormFieldInputProps) {
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
      <Input
        id={fieldId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={getAriaDescribedBy(description, error)}
        className="w-full"
        {...inputProps}
      />
    </FormFieldShell>
  )
}
