---
name: ui-patterns
description: GraphLand's common UI guideline — canonical patterns and ready-to-copy component templates for forms (React Hook Form + Zod), data tables with URL-synced pagination/sort/search, sheet-based create/edit/filter/view panels, a lightweight GraphQL client with co-located ~util.ts operations, and confirmation/i18n hooks. Use when building CRUD list pages, forms with Zod validation, server-paginated data tables, side-panel (sheet) UIs, or when starting or reviewing any GraphLand frontend project.
---

# GraphLand UI Patterns

The company-wide UI guideline with bundled templates in [templates/](templates/). Canonical stack: React + Vite + TanStack Router/Query + shadcn/ui + Tailwind. Every pattern has an **Adaptation** section in its reference doc for Next.js, React Router, or REST backends — read [references/adaptation.md](references/adaptation.md) before applying the patterns outside the canonical stack.

**Foundation not installed yet?** Run the `setup-foundation` skill (or follow it manually) before scaffolding pages. Templates live in [templates/](templates/) — copy them verbatim rather than re-deriving them.

## Pattern map

| Pattern | Use when | Reference | Templates |
| --- | --- | --- | --- |
| Forms | Any user input — schema-first validation with Zod + React Hook Form, rendered with `FormField*` wrappers | [references/forms.md](references/forms.md) | `templates/form/` |
| Data table | Any list page — GraphLand `DataTable` (wraps ReUI DataGrid) with server-side pagination/sort/debounced-search driven by URL search params; call sites use a clean `ColumnDef` API, never ReUI/TanStack directly | [references/data-table.md](references/data-table.md) | `templates/table/` |
| Sheets | Create/edit, filters, and read-only detail views as right-side panels instead of separate routes | [references/sheets.md](references/sheets.md) | `templates/example-module/` |
| Data layer | GraphQL via the tiny `gqlClient` + co-located `~util.ts` per route (optional — REST variant documented) | [references/data-layer.md](references/data-layer.md) | `templates/lib/` |
| Hooks | Imperative confirm dialogs (`useConfirmation`), i18n (`useI18N`), responsive checks (`useIsMobile`) | [references/hooks.md](references/hooks.md) | `templates/hooks/` |

## Core principles

1. **URL is the source of truth for list state.** Page, page size, sort (`"column:asc"`), search, and filters live in URL search params — never in component state. Lists become shareable, bookmarkable, and survive reloads.
2. **Sheets over routes for CRUD.** Create/edit opens a `Sheet` on the list page; one form component serves both modes via an `entity?: T | null` prop (`null` = create, value = edit). The user never loses list context.
3. **Schema-first forms.** Each entity has one Zod schema (`entityFormSchema`) co-located with its data operations; the form type is always `z.infer<typeof schema>`.
4. **Co-located data operations.** Each route folder has a `~util.ts` holding its queries, mutations, and form schema. Query keys follow `[resource, ...params]`; invalidate by resource prefix after mutations.
5. **Copy, don't re-derive.** The templates are battle-tested (debounce edge cases, sort-dedupe, reset-on-open). Copy them and adapt imports; don't rewrite from memory.

## End-to-end example

`templates/example-module/` is a complete generic CRUD module — list page (`index.tsx`), `~util.ts`, form sheet, and filter sheet wired together. When building a new module, start from it (or run the `new-module` skill).
