# GraphLand Skills

GraphLand's company-wide **fullstack engineering guideline**, packaged as agent skills. It captures the patterns proven in production on the Banik console (frontend) and the waland platform (backend + monorepo), so every GraphLand project — current and future — is built the same way.

## Install

**With the [skills CLI](https://github.com/vercel-labs/skills)** (works with Claude Code, Cursor, Codex, and 60+ agents):

```
npx skills add graphland-dev/skills
```

**As a Claude Code plugin:**

```
/plugin marketplace add graphland-dev/skills
/plugin install graphland@graphland
```

## What's inside

### `frontend/` — React console patterns

| Skill | What it does |
| --- | --- |
| `ui-patterns` | The frontend guideline — forms (RHF + Zod), `DataTable` (wraps ReUI DataGrid), sheet-based CRUD, data layer, hooks. Auto-loaded when relevant. |
| `setup-foundation` | Bootstrap a project: deps, shadcn + ReUI DataGrid, foundation components, providers. |
| `new-module` | Scaffold a CRUD list module (list page, `~util.ts`, form sheet, filter sheet). |
| `new-form-page` | Scaffold a full-page multi-section create/edit form. |
| `new-view-sheet` | Scaffold a read-only detail side panel with tabs. |
| `new-graphql-util` | Generate a `~util.ts` with GQL operations + Zod schema. |

### `backend/` — NestJS API patterns

| Skill | What it does |
| --- | --- |
| `api-patterns` | The backend guideline — feature-module anatomy, class-validator DTOs, pagination contract, org multi-tenancy with Better Auth, Joi-validated config. Auto-loaded when relevant. |
| `new-api-module` | Scaffold an org-scoped CRUD feature module (controller/service/repository/DTOs/entity). |

### `fullstack/` — monorepo

| Skill | What it does |
| --- | --- |
| `setup-workspace` | Bootstrap a bun-workspace monorepo: `apps/api` (NestJS) + `apps/console` (React) + mprocs + docker-compose (Mongo/Redis). |

## The architecture in one paragraph

A **bun workspace** monorepo (`apps/*`, `packages/*`) where `bun dev` runs every app via mprocs. The **API** is NestJS + Mongoose with strict controller→service→repository layering, class-validator DTOs behind a strict global ValidationPipe, a uniform `{ data, meta }` pagination contract, and org-scoped multi-tenancy powered by Better Auth. The **console** is React 19 + Vite + TanStack Router/Query + shadcn, with schema-first forms, sheet-based CRUD, URL-driven list state, and a `DataTable` wrapper over ReUI DataGrid. The API's pagination meta feeds the frontend table directly.

## Source of truth

Frontend templates come from `console.banik.app`; backend/monorepo patterns from `waland`. When those production apps evolve, port the changes here and bump the plugin version. Target projects should not hand-edit copied foundation files — upstream improvements through this repo.
