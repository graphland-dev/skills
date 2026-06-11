# GraphLand UI — Common UI Guideline

GraphLand's company-wide UI guideline as a [Claude Code plugin](https://docs.claude.com/en/docs/claude-code/plugins). It captures the patterns proven in production on the Banik console (`console.banik.app`) so every GraphLand frontend — current and future — builds UI the same way.

## What's inside

| Skill | What it does |
| --- | --- |
| `graphland-ui:ui-patterns` | The guideline itself — pattern docs + battle-tested component templates. Auto-loaded by the agent when relevant. |
| `/graphland-ui:setup-foundation` | Bootstrap a project: install deps + shadcn components, copy the foundation files, wire providers. |
| `/graphland-ui:new-module` | Scaffold a full CRUD list module (list page, `~util.ts`, form sheet, filter sheet). |
| `/graphland-ui:new-form-page` | Scaffold a full-page multi-section create/edit form. |
| `/graphland-ui:new-view-sheet` | Scaffold a read-only detail side panel with tabs. |
| `/graphland-ui:new-graphql-util` | Generate a `~util.ts` with GQL queries/mutations + Zod schema. |

## The patterns

1. **Forms** — React Hook Form + Zod via `zodResolver`, rendered with `FormField*` wrapper components. One Zod schema per entity, co-located with its GraphQL operations.
2. **Data table** — `DataTable`, a GraphLand wrapper over [ReUI DataGrid](https://reui.io/docs/data-grid) with our own prop API: server-side pagination, sorting, and debounced search, all driven by **URL search params** so list state is shareable and survives reloads. Call sites never touch ReUI or TanStack directly.
3. **Sheets over routes for CRUD** — create/edit happens in a right-side `Sheet`; a single component handles both modes via an `entity?: T | null` prop. Filters and read-only detail views are sheets too.
4. **Data layer** — a tiny fetch-based GraphQL client (`gql = String.raw`, no runtime GraphQL dependency) wrapped in TanStack Query; each route keeps its operations in a co-located `~util.ts`.
5. **Hooks** — `useConfirmation` for imperative confirm dialogs, `useI18N` for translations keyed by English strings, `useIsMobile`.

The canonical implementation targets React + Vite + TanStack Router/Query + shadcn/Tailwind, but every pattern doc includes an **Adaptation** section for Next.js, React Router, and REST backends.

## Install

```
/plugin marketplace add graphland-dev/graphland-ui
/plugin install graphland-ui@graphland
```

Or for local development:

```
claude --plugin-dir /path/to/graphland-ui
```

## Quick start in a new project

1. Run `/graphland-ui:setup-foundation graphql` (or `rest`) — installs dependencies, copies the foundation components, wires providers.
2. Run `/graphland-ui:new-module <route-path> <EntityName>` for each CRUD screen.
3. Ask the agent anything about the patterns — the `ui-patterns` skill loads automatically.

## Source of truth

Templates are copied from `console.banik.app` and genericized (no tenant logic, no generated GraphQL types, no custom button variants). When the console's components evolve, sync the templates here.
