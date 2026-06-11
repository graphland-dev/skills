export type FormFieldOrientation = 'vertical' | 'horizontal' | 'responsive'

export type FormFieldBaseProps = {
  id?: string
  label: string
  description?: string
  error?: string
  required?: boolean
  requiredTooltip?: string
  info?: string
  disabled?: boolean
  orientation?: FormFieldOrientation
  className?: string
}

export type FormFieldOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export type FormFieldCreateComponentProps = {
  onClose: () => void
  onCreated: (option: { value: string; label: string }) => void
}
