import { FormFieldShell, useFormFieldIds } from './form-field-shell'
import {
  PasswordInput,
  type PasswordInputProps,
} from '@/components/ui/password-input'

import type { FormFieldBaseProps } from './types'

export type FormFieldPasswordInputProps = FormFieldBaseProps &
  Omit<PasswordInputProps, 'id' | 'type'>

export function FormFieldPasswordInput({
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
  ...passwordInputProps
}: FormFieldPasswordInputProps) {
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
      <PasswordInput
        id={fieldId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={getAriaDescribedBy(description, error)}
        className="w-full"
        {...passwordInputProps}
      />
    </FormFieldShell>
  )
}
