# Adaptation — applying the guideline outside the canonical stack

The canonical stack is **React + Vite + TanStack Router + TanStack Query + shadcn/ui + Tailwind + GraphQL**. The templates compile as-is there. Everything else is a bounded set of swaps — the patterns (URL-driven list state, sheet-based CRUD, schema-first forms, co-located data operations) survive every swap.

## What is stack-agnostic (no changes ever)

- All of `templates/form/`, `templates/ui/`, `templates/hooks/`, `templates/table/filter-sheet.tsx`, `templates/table/filter-combobox.tsx`
- `templates/table/data-grid-toolbar.tsx` and the registry-installed ReUI DataGrid — no router/data dependency
- The Zod schema + `z.infer` convention, the `entity?: T | null` sheet convention, query-key conventions

## Router swaps (affects only page files like `example-module/index.tsx`)

| Concern | TanStack Router (canonical) | Next.js App Router | React Router |
| --- | --- | --- | --- |
| Read params | `useSearch({ from })` + `validateSearch: z.object(...)` | `useSearchParams()`; parse with the same Zod schema | `useSearchParams()` |
| Write params | `navigate({ search: { ...sp, page: 1 }, replace: true })` | `router.replace(pathname + "?" + qs)` via `URLSearchParams` | `setSearchParams(qs, { replace: true })` |
| Route files | file-based, `~` prefix = non-route co-location | `app/<segment>/page.tsx`; co-locate in `_components/`, `_lib/` | manual route config |
| Numbers in URL | Zod coerces via `validateSearch` | `z.coerce.number().optional()` when parsing | same |

For Next.js, name co-located files `_components/` and `_util.ts` (underscore = ignored by the App Router) instead of the `~` prefix.

## Next.js specifics

- Every template is a client component — add `"use client"` to pages that use them, or keep a server `page.tsx` that renders a client list component.
- Providers (`ConfirmationProvider`, `I18NProvider`, `QueryClientProvider`) go in a client component mounted from the root layout.
- `import.meta.env.VITE_BACKEND_BASE_URL` → `process.env.NEXT_PUBLIC_BACKEND_BASE_URL` in `gql-client.ts`.
- localStorage-based `token-service` works only client-side; for server fetching, pass cookie-derived headers per request.

## Data-layer swaps

See [data-layer.md](data-layer.md) → Adaptation. Summary: REST projects drop `gql-client.ts`/`token-service.ts`, keep `~util.ts` co-location with typed fetch functions, and map `buildPaginationParams` output to their query-string shape. Codegen projects re-point hand-written types/enums at generated ones.

## Design-system swaps

The templates assume shadcn/ui with the `@/` path alias and a `cn()` helper in `@/lib/utils`. Required shadcn components: `button`, `input`, `textarea`, `checkbox`, `radio-group`, `slider`, `label`, `sheet`, `dialog`, `table`, `popover`, `command`, `calendar`, `skeleton`, `tooltip`, `dropdown-menu`, `select`, `card`, `separator`, `alert` (the RHF `form` primitives are bundled as `templates/ui/form.tsx` since the registry retired them). The data grid comes from the ReUI registry (`npx shadcn@latest add @reui/data-grid …`, see [data-table.md](data-table.md)) and brings its own deps (`@dnd-kit/*`, `@tanstack/react-virtual`). Banik's console also defines extra Button variants (e.g. `link-destructive`) — the templates here use only stock variants.

## Sync policy

Source of truth is `console.banik.app`. When its components gain fixes/features, port them here and bump the plugin version. Do not let target projects edit copied foundation files ad hoc — upstream improvements through this plugin instead.
