---
name: setup-foundation
description: Bootstrap a project with the GraphLand UI foundation — install dependencies and shadcn components, copy the form/table/hooks/lib templates, and wire root providers. Use once per project before scaffolding modules.
argument-hint: [graphql|rest]
disable-model-invocation: true
---

Install the GraphLand UI foundation into the current project. Data-layer variant from arguments (default `graphql`): **$ARGUMENTS**

Before starting, read the guideline's adaptation notes at `${CLAUDE_PLUGIN_ROOT}/skills/ui-patterns/references/adaptation.md` and detect the project's stack (Vite vs Next.js, router, whether shadcn is initialized, package manager). If the project is not React + Tailwind, stop and tell the user this guideline targets React.

## 1. Dependencies

Install (with the project's package manager): `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, `@tanstack/react-table`, `lucide-react`.

If shadcn/ui is not initialized, run `npx shadcn@latest init` first. Then add the required components:

```
npx shadcn@latest add button input textarea checkbox radio-group slider label form sheet dialog table popover command calendar skeleton tooltip dropdown-menu select card separator alert
```

## 2. Copy foundation files from `${CLAUDE_PLUGIN_ROOT}/skills/ui-patterns/templates/`

| From templates/ | To project |
| --- | --- |
| `form/*` | `src/components/form/` |
| `table/*` | `src/components/table/` |
| `ui/combobox.tsx`, `ui/date-picker-popover.tsx`, `ui/page-header.tsx` | `src/components/ui/` |
| `hooks/*` | `src/hooks/` |
| `lib/date-format.ts` | `src/lib/` |
| `lib/gql-client.ts`, `lib/token-service.ts` | `src/lib/` — **graphql variant only** |
| `lib/form-utils.ts` | `src/lib/` |

For the `rest` variant, skip gql-client/token-service and tell the user to keep `~util.ts` co-location with typed fetch functions (see `references/data-layer.md` → Adaptation).

Adjust if needed:
- No `@/` path alias → add one to tsconfig/vite config (preferred) or rewrite imports.
- Next.js → apply the swaps in `references/adaptation.md` (`"use client"`, `NEXT_PUBLIC_BACKEND_BASE_URL`, `_components/` naming).

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

Run the project's TypeScript check (`tsc --noEmit` or the build script). Fix any import-path issues. Then suggest scaffolding the first screen with `/graphland-ui:new-module`.
