import { TriangleAlertIcon } from 'lucide-react'
import type { ZodError } from 'zod'

import { cn } from '@/lib/utils'

export type FormErrorProps = {
  errors?: string[]
  title?: string
  className?: string
}

export function FormError({
  errors,
  title = 'Please fix the following errors',
  className,
}: FormErrorProps) {
  if (!errors?.length) {
    return null
  }

  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <TriangleAlertIcon
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const flattened = error.flatten()
  const fieldErrors: Record<string, string> = {}

  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    const message = Array.isArray(messages) ? messages[0] : undefined
    if (message) {
      fieldErrors[field] = message
    }
  }

  return fieldErrors
}

export function formErrorsFromZod(
  error: ZodError,
  fieldLabels: Record<string, string> = {},
): string[] {
  const flattened = error.flatten()
  const errors = [...flattened.formErrors]

  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    const message = Array.isArray(messages) ? messages[0] : undefined
    if (!message) continue

    const label = fieldLabels[field] ?? field
    errors.push(`${label}: ${message}`)
  }

  return [...new Set(errors)]
}
