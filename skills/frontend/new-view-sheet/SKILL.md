---
name: new-view-sheet
description: Scaffold a read-only detail view sheet with tabs (Basic Info, related records, optional Documents) following the GraphLand UI guideline. Use when an entity needs a side-panel detail view from its list page.
argument-hint: <route-path> <EntityName>
disable-model-invocation: true
---

> **Locating sibling skills:** paths like `ui-patterns/...` or `api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Scaffold a view sheet — a read-only right-side panel opened from a list row, with a tab strip. Pattern reference: `ui-patterns/references/sheets.md` (View sheet section).

**Arguments:** $ARGUMENTS — if empty or not substituted by your agent, ask the user.
**Format:** `<route-path> <EntityName>` — e.g. `clients Client` · `suppliers Supplier`

## 0. Preconditions and questions

- Verify the foundation exists (`src/components/table/data-table.tsx` + ReUI data-grid in `src/components/reui/data-grid/`, sheet components); if not, point to the `setup-foundation` skill.
- Ask the user:
  1. Which **related record tabs** (e.g. invoices, payments)? If none, generate Basic Info only.
  2. The **GraphQL namespace** for related queries (or REST endpoints).
  3. Is a **Documents/uploads tab** needed? (Only if the project has an upload component — don't invent one.)

## 1. Generate `~components/<entity>-view-sheet.tsx`

```tsx
interface EntityViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
}
```

Structure:

- `Sheet` with `SheetContent side="right" className="sm:max-w-2xl overflow-y-auto"`; title = entity name with an Edit button that opens the existing `EntityFormSheet` (render it inside this component, passing the entity).
- Tab strip via `useState<TabType>("basic")` with icon buttons (lucide icons per tab).
- **Basic Info tab**: a two-column label/value grid of the entity's fields; format dates with the project's date helper and money with the project's format helper.
- **Related record tab(s)**: one `<DataTable>` per tab with **local** `useState` for `page`/`pageSize` (not URL state, since this is a panel) wired to its `page`/`pageSize`/`onPaginationChange` props, backed by a `useQuery` filtered to the entity (`filters: [{ key: "<entityRef>", operator: Eq, value: entity._id }]`), `enabled: open && activeTab === "<tab>" && !!entity?._id`. Define GraphLand `ColumnDef`s per `references/data-table.md`.
- Guard all queries on `open` and `entity?._id` so nothing fetches while closed.

Wire into the list page: a `useState<Entity | null>` for the viewed entity, opened via `onRowClick` or a View action button.

## 2. After generating

1. Run the TypeScript check.
2. Remind the user to fill in real fields for the Basic Info grid and real queries/columns for each related tab.
