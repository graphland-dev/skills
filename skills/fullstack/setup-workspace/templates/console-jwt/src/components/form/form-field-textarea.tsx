import * as React from 'react'

import { FormFieldShell, useFormFieldIds } from './form-field-shell'
import { Textarea } from '@/components/ui/textarea'

import type { FormFieldBaseProps } from './types'

export type FormFieldTextAreaProps = FormFieldBaseProps &
  Omit<React.ComponentProps<typeof Textarea>, 'id'>

export function FormFieldTextArea({
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
  ...textareaProps
}: FormFieldTextAreaProps) {
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
      <Textarea
        id={fieldId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={getAriaDescribedBy(description, error)}
        className="w-full"
        {...textareaProps}
      />
    </FormFieldShell>
  )
}
