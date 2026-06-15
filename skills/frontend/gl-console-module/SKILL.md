---
name: gl-console-module
description: Scaffold a full CRUD list module (list page, ~util.ts, form sheet, filter sheet) following the GraphLand UI guideline. Use when adding a new list page with create/edit/delete operations.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-invocation: "manual"  # run on explicit request, not auto-triggered
  graphland-input: "<route-path> <EntityName>"
---

> **Locating sibling skills:** paths like `gl-console-patterns/...` or `gl-api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Scaffold a full CRUD list module following the GraphLand UI guideline.

**Input:** a route path and entity name (from the user's request; if not given, ask).
**Format:** `<route-path> <EntityName>` — e.g. `products/services Service` · `employees/departments Department`

## 0. Preconditions and questions

- Verify the foundation exists (`src/components/table/data-table.tsx`, `src/components/reui/data-grid/`, `src/components/form/`, `src/hooks/use-confirm.tsx`). If missing, stop and point the user to the `gl-console-setup` skill.
- Detect the router and data layer. The canonical example targets TanStack Router + GraphQL; for Next.js/React Router or REST, apply the swaps in `gl-console-patterns/references/adaptation.md` while keeping the structure identical.
- Derive the plural from EntityName (`Service` → `services`).
- Ask the user:
  1. The entity's **fields** (name/type/required) — but first check for a matching API module (e.g. `apps/api/src/api/<entity>/` in a GraphLand monorepo, or the GraphQL schema): if one exists, derive fields, enums, and validation from its DTOs/entity and just confirm the list with the user instead of asking from scratch.
  2. The **GraphQL namespace** (operations are `namespace__entities`, etc.) **or the REST endpoints** when the data layer is REST — skip if already obvious from the API module.
  3. Which columns are **searchable**, and which fields belong in the **filter sheet** (default: status-like enums and date ranges).

## 1. Generate the four files

Copy the canonical example from `gl-console-patterns/templates/example-module/` into the route folder, substituting every occurrence of `Entity`/`entity`/`entities` with the real entity name and `Namespace`/`namespace` with the real namespace:

| Template | Target (canonical stack) |
| --- | --- |
| `~util.ts` | `src/routes/<route-path>/~util.ts` — queries, mutations, Zod schema, entity types |
| `index.tsx` | `src/routes/<route-path>/index.tsx` — list page wiring URL params ↔ `<DataTable>` ↔ queries |
| `~components/entity-form-sheet.tsx` | `src/routes/<route-path>/~components/<entity>-form-sheet.tsx` |
| `~components/entity-filter-sheet.tsx` | `src/routes/<route-path>/~components/<entity>-filter-sheet.tsx` |

Update the route paths inside `index.tsx` (`createFileRoute("/<route-path>/")`, `useSearch`/`useNavigate` `from` values) to the real route. Extend with the entity's real fields:

- `~util.ts`: real GQL fields in the queries, real Zod schema entries, real `Entity` type fields (or generated types if the project has codegen).
- `index.tsx`: real GraphLand `ColumnDef` entries (`{ accessor, title, sortable, sortKey?, cell?, align? }` — set `sortKey` for function accessors or when the display field differs from the backend sort field) plus the `searchableColumns` list and extra filter params in `validateSearch` and `paginationParams`. Row actions go through the `actions` render prop, not a column.
- Form sheet: a `FormField*` component per schema field (catalog in `references/forms.md`); matching `defaultValues` and `form.reset` payloads.
- Filter sheet: real `FilterField` entries.

If the project keeps query keys tenant-scoped (multi-tenant), add the scope segment to every `queryKey` and invalidation: `["entities", tenant, params]`.

## 2. After generating

1. Run the TypeScript check; fix imports.
2. Remind the user to replace any remaining placeholder fields with real backend fields, and (canonical stack) that `routeTree.gen.ts` regenerates on `dev`/`build`.
