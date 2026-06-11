---
name: new-form-page
description: Scaffold a full-page multi-section create/edit form (not a sheet) following the GraphLand UI guideline. Use for complex entities — invoices, purchases, orders — that need a dedicated page rather than a side sheet.
argument-hint: <route-path> <EntityName>
disable-model-invocation: true
---

Scaffold a full-page form following the GraphLand UI guideline. Sheets (see `/graphland-ui:new-module`) are the default for simple CRUD — use a full page only when the entity has many fields, multiple logical sections, or line items.

**Arguments:** $ARGUMENTS
**Format:** `<route-path> <EntityName>` — e.g. `invoices/create Invoice` · `purchases/create Purchase`

## 0. Preconditions and questions

- Verify the foundation exists (`src/components/form/`); if not, point to `/graphland-ui:setup-foundation`.
- Ask the user:
  1. **Create-only**, or also **edit mode** (loaded from a URL param like `$entityId`)?
  2. The **GraphQL namespace** (or REST endpoints if the project is REST).
  3. A **line items** section (repeated rows via `useFieldArray`)?

## 1. Generate

**File 1 — `~util.ts`** in the route folder: create mutation (+ get-by-id query and update mutation if edit mode) and the Zod schema, following `/graphland-ui:new-graphql-util` conventions. For line items: `items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().min(1), unitPrice: z.coerce.number().min(0) })).min(1, "At least one item is required")`.

**File 2 — `index.tsx`**, structured as:

- `PageHeader` with title + a Back button navigating to the parent list route.
- `<Form {...form}>` with `FormErrorAlert` at the top fed by `getMutationErrorMessage(createMutation)`.
- One shadcn `Card` per logical section (Basic Information, Line Items, Notes, …) containing `FormField*` components (catalog: `${CLAUDE_PLUGIN_ROOT}/skills/ui-patterns/references/forms.md`).
- Line items section: `useFieldArray` rows with add/remove buttons and computed totals.
- Submit bar at the bottom: Cancel (navigates back) + Save with pending state (`Saving...`).
- `onSuccess`: invalidate the entity's list query by prefix, then navigate to the list route.

Edit mode: a `$entityId` dynamic segment route fetches the entity with `useQuery` and populates `form.reset(...)` in a `useEffect` when data arrives; submit switches between create/update mutations.

Use the project's router idioms — TanStack Router canonical; otherwise apply `references/adaptation.md`.

## 2. After generating

1. Run the TypeScript check.
2. Remind the user to replace placeholder fields with real backend fields and confirm the parent list route used by Back/Cancel/onSuccess navigation.
