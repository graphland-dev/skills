---
name: gl-console-foundation
description: Bootstrap a project with the GraphLand UI foundation — install dependencies and shadcn components, copy the form/table/hooks/lib templates, and wire root providers. Use once per project before scaffolding modules.
argument-hint: [graphql|rest]
disable-model-invocation: true
---

> **Locating sibling skills:** paths like `gl-console-patterns/...` or `gl-api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Install the GraphLand UI foundation into the current project. Data-layer variant from arguments (default `graphql` if empty/unsubstituted): **$ARGUMENTS**

Before starting, read the guideline's adaptation notes at `gl-console-patterns/references/adaptation.md` and detect the project's stack (Vite vs Next.js, router, whether shadcn is initialized, package manager). If the project is not React + Tailwind, stop and tell the user this guideline targets React.

## 1. Dependencies

Install (with the project's package manager): `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, `@tanstack/react-table`, `lucide-react`.

If shadcn/ui is not initialized, run `npx shadcn@latest init` first. Then add the required components:

```
npx shadcn@latest add button input textarea checkbox radio-group slider label sheet dialog table popover command calendar skeleton tooltip dropdown-menu select card separator alert
```

Then install the ReUI DataGrid (the standard GraphLand data table) from the ReUI registry — it lands in `src/components/reui/data-grid/` and pulls its own deps (`@dnd-kit/*`, `@tanstack/react-virtual`):

```
npx shadcn@latest add @reui/data-grid @reui/data-grid-table @reui/data-grid-pagination @reui/data-grid-scroll-area @reui/data-grid-column-header @reui/data-grid-column-visibility
```

The CLI may prompt to overwrite existing shadcn components (e.g. `popover`, `select`) the grid depends on — accept (`--overwrite`) so the grid's expected versions are installed. Two post-install notes: (1) ReUI's grid source uses runtime imports for some types, which trips `verbatimModuleSyntax: true` (Vite's default) with `TS1484` errors confined to `src/components/reui/data-grid/*` — either set `"verbatimModuleSyntax": false` in tsconfig or run a one-pass codemod to make those `import type`; the GraphLand templates themselves are clean. (2) The grid pulls `@reui/badge` and a `spinner` component into `src/components/`.

## 2. Copy foundation files from `gl-console-patterns/templates/`

| From templates/ | To project |
| --- | --- |
| `form/*` | `src/components/form/` |
| `table/*` (`data-table.tsx`, `table-utils.ts`, `filter-sheet.tsx`, `filter-combobox.tsx`) | `src/components/table/` |
| `ui/combobox.tsx`, `ui/date-picker-popover.tsx`, `ui/page-header.tsx`, `ui/form.tsx` | `src/components/ui/` |

Note: `ui/form.tsx` (the React Hook Form `<Form*>` primitives) must be copied — the current shadcn registry no longer ships a `form` item.
| `hooks/*` | `src/hooks/` |
| `lib/date-format.ts` | `src/lib/` |
| `lib/gql-client.ts`, `lib/token-service.ts` | `src/lib/` — **graphql variant only** |
| `lib/form-utils.ts` | `src/lib/` |

For the `rest` variant, skip gql-client/token-service and tell the user to keep `~util.ts` co-location with typed fetch functions (see `references/data-layer.md` → Adaptation).

Adjust if needed:
- No `@/` path alias → add one to tsconfig/vite config (preferred) or rewrite imports.
- Next.js → apply the swaps in `references/adaptation.md` (`"use client"`, `NEXT_PUBLIC_BACKEND_BASE_URL`, `_components/` naming).

Known gotchas (verified against a fresh Vite + latest-shadcn project):
- ReUI's installed sources don't use type-only imports and have one unused variable — if the project's tsconfig enables `verbatimModuleSyntax` or `noUnusedLocals`, either relax those flags or fix the ReUI files after install.
- If shadcn's `calendar.tsx` type-errors against the installed `react-day-picker`, pin `react-day-picker@^9` (the foundation's date components target the v9+ API: `startMonth`/`endMonth`, `disabled` matchers, `autoFocus`).

## 3. Wire providers at the app root

```tsx
<QueryClientProvider client={queryClient}>
  <I18NProvider>
    <ConfirmationProvider>
      {/* app */}
    </ConfirmationProvider>
  </I18NProvider>
</QueryClientProvider>
```

For the graphql variant, ensure the backend URL env var is set (`VITE_BACKEND_BASE_URL` or framework equivalent) and mention it must point at the GraphQL endpoint's base URL (client appends `/graphql`).

## 4. Verify

Run the project's TypeScript check (`tsc --noEmit` or the build script). Fix any import-path issues. Then suggest scaffolding the first screen with the `gl-console-module` skill.
