# Forms — React Hook Form + Zod

## Why this pattern

Validation lives in one Zod schema per entity, co-located with the entity's data operations in `~util.ts`. The form's TypeScript type is always derived (`z.infer`), so schema, validation messages, and types can never drift apart. Field rendering goes through `FormField*` wrapper components so labels, required asterisks, descriptions, and error display are consistent everywhere.

## The pattern

```ts
// ~util.ts — schema next to the entity's queries/mutations
export const entityFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"), // coerce for <input> strings
  description: z.string().optional(),
});
export type EntityFormValues = z.infer<typeof entityFormSchema>;
```

```tsx
// component
const form = useForm<EntityFormValues>({
  resolver: zodResolver(entityFormSchema),
  defaultValues: { name: "", amount: 0, description: "" }, // always provide all fields
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormErrorAlert message={errorMessage} />
    <FormFieldInput control={form.control} name="name" label="Name" placeholder="Enter name" required />
    <FormFieldComboboxSelect control={form.control} name="categoryId" label="Category" options={options} />
    <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
  </form>
</Form>
```

## Field wrapper catalog (`templates/form/`)

| Component | For | Notes |
| --- | --- | --- |
| `FormFieldInput` | text/number/email/password | `type`, `icon`, `required`, `description` props |
| `FormFieldTextarea` | multi-line text | `rows` |
| `FormFieldComboboxSelect` | searchable select | `options: { value, label }[]`, needs `templates/ui/combobox.tsx` |
| `FormFieldCheckbox` | boolean toggle | label + description layout |
| `FormFieldRadioGroup` | small enums | `options` |
| `FormFieldDatePicker` | dates | needs `templates/ui/date-picker-popover.tsx` + `templates/lib/date-format.ts` |
| `FormFieldSlider` | bounded numbers | min/max/step |
| `FormErrorAlert` / `FormSuccessAlert` | submit-level feedback | render `null` when message is empty — always safe to include |
| `RequiredAsterisk` | marking required labels | used internally by wrappers |

All wrappers take `control={form.control}` and `name` (typed against the schema). They build on shadcn's `Form`/`FormField` primitives.

## Conventions

- `z.coerce.number()` for any numeric `<input>` — DOM inputs yield strings.
- `.trim().min(1, "X is required")` for required strings — rejects whitespace-only input.
- Mutation errors are surfaced via `FormErrorAlert` using `getMutationErrorMessage(mutation)` from the data layer (see [data-layer.md](data-layer.md)) — not per-field.
- In sheets, reset the form when the panel opens, not on close (see [sheets.md](sheets.md)).

## Adaptation

- **No GraphQL**: the schema/wrapper pattern is data-layer independent; only where `~util.ts` lives changes (keep schema next to whatever fetch functions you write).
- **Next.js**: wrappers are client components (`"use client"` at usage site). Server Actions can re-validate with the same Zod schema on the server — export it from a shared module.
- **Missing shadcn pieces**: wrappers require shadcn `form`, `input`, `textarea`, `checkbox`, `radio-group`, `slider`, `label`, `popover`, `command`, `calendar`, `tooltip`, `skeleton` components (see setup-foundation).
