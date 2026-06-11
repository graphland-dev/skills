# GraphLand Skills

GraphLand's company-wide **fullstack engineering guideline**, packaged as agent skills. It captures patterns proven in production — **waland** (Better Auth monorepo), **Banik** (console UI patterns), and **storeos** (custom JWT + GraphQL auth) — so every GraphLand project is built the same way.

## Install

**Recommended** — install the full skill pack (scaffold skills depend on `ui-patterns` / `api-patterns` templates):

```bash
npx skills add graphland-dev/skills --all -y
```

Install for a specific agent:

```bash
npx skills add graphland-dev/skills --all -a cursor -y
npx skills add graphland-dev/skills --all -a claude-code -y
```

List skills without installing:

```bash
npx skills add graphland-dev/skills --list
```

**As a Claude Code plugin** (optional):

```
/plugin marketplace add graphland-dev/skills
/plugin install graphland@graphland
```

Skills install to `.agents/skills/` (project) or `~/.agents/skills/` (global). Scaffold skills reference sibling paths like `ui-patterns/templates/...` — install the full pack, not individual skills alone.

## What's inside

### `frontend/` — React console patterns

| Skill | What it does |
| --- | --- |
| `ui-patterns` | Frontend guideline — forms, `DataTable`, sheets, data layer, hooks. Auto-loaded when relevant. |
| `setup-foundation` | Bootstrap foundation into an **existing** app (shadcn, form/table components, providers). |
| `new-module` | Scaffold a CRUD list module (list page, `~util.ts`, form sheet, filter sheet). |
| `new-form-page` | Scaffold a full-page multi-section create/edit form. |
| `new-view-sheet` | Scaffold a read-only detail side panel with tabs. |
| `new-graphql-util` | Generate a `~util.ts` with GQL operations + Zod schema. |

### `backend/` — NestJS API patterns

| Skill | What it does |
| --- | --- |
| `api-patterns` | Backend guideline — feature modules, DTOs, pagination, Better Auth tenancy. Auto-loaded when relevant. |
| `new-api-module` | Scaffold an org-scoped CRUD module (**Better Auth only** — uses `@UserSessionGuard` + `@OrganizationId()`). |

### `fullstack/` — monorepo

| Skill | What it does |
| --- | --- |
| `setup-workspace` | Bootstrap a bun monorepo: `apps/api` + `apps/console` + mprocs + docker-compose. Asks intake questions first. |

## Sample prompts

Copy these into Cursor, Claude Code, Codex, or any agent with the skills installed. The agent should load the matching skill automatically, or you can name it explicitly.

### New monorepo (full intake in one prompt)

```
Use the setup-workspace skill to bootstrap a new monorepo called "acme".

Choices:
- Console: Vite
- API data: REST
- Auth: Better Auth (waland style)

Scaffold apps/api and apps/console, wire docker-compose, and verify both apps build.
```

The agent should confirm: *"Scaffolding acme — Vite console, REST API, Better Auth."* then scaffold. If you omit choices, it will ask.

### New monorepo — let the agent ask

```
/setup-workspace acme
```

or:

```
I need a new GraphLand fullstack monorepo called acme. Walk me through the setup choices and scaffold it.
```

### waland stack (default)

```
setup-workspace for "waland-clone"

Vite console, REST API, Better Auth. Match waland/apps/console and waland/apps/api.
After bootstrap, add a Project CRUD — API module + console list page.
```

### storeos-style auth

```
setup-workspace for "my-saas"

Vite console, GraphQL API, custom JWT auth like storeos.
Authorization decorators must stay in the API (Authenticated, PermissionGuard, x-tenant).
Do not use Better Auth or new-api-module — hand-scaffold resolvers with @Authenticated().
```

### Next.js console

```
setup-workspace for "acme-admin"

Next.js App Router console, REST API, Better Auth.
Use TanStack Query (not TanStack Router on Next). Apply ui-patterns adaptation.md.
```

### GraphQL console (Better Auth)

```
setup-workspace for "banik-clone"

Vite, GraphQL API, Better Auth.
Console uses gql-client from ui-patterns; API needs a GraphQL module at /graphql.
```

### Add a feature to an existing project

```
# Better Auth + REST (after setup-workspace)
Use new-api-module to add a NestJS Invoice module, then new-module for console route invoices/Invoice.

# GraphQL util only
Use new-graphql-util for Entity accounting in the products route folder.

# Full-page form
Use new-form-page for purchases/create Purchase — multi-section form with line items.
```

### Frontend-only (existing Vite app)

```
Use setup-foundation rest in this project, then new-module for products/Product.
```

Use `setup-foundation graphql` when the backend is GraphQL. Skip `setup-foundation` if the app was created by `setup-workspace` with Better Auth — foundation is already there.

### Review / conventions check

```
Review this NestJS module against api-patterns — DTOs, pagination, org scoping.

Review this list page against ui-patterns — URL state, DataTable, sheet CRUD.
```

## Intake cheat sheet (`setup-workspace`)

| Question | Options | Default |
| --- | --- | --- |
| Console | `vite` · `nextjs` | `vite` |
| API data | `rest` · `graphql` · `both` | `rest` |
| Auth | `better-auth` · `custom-jwt` | `better-auth` |

**Stack rules:** Vite → TanStack Router + TanStack Query. Next.js → App Router + TanStack Query. Never React Router.

| Auth | API reference | Console reference |
| --- | --- | --- |
| `better-auth` | `waland/apps/api` | `waland/apps/console` |
| `custom-jwt` | `storeos/apps/core-api` | `storeos/apps/web-console` |

## Architecture (typical waland monorepo)

A **bun workspace** (`apps/*`, `packages/*`) where `bun dev` runs every app via mprocs.

- **API** — NestJS + Mongoose, controller→service→repository, class-validator DTOs, `{ data, meta }` pagination, Better Auth org tenancy.
- **Console** — React 19 + Vite + TanStack Router/Query + shadcn, sheet-based CRUD, URL-driven list state, custom `DataTable` (TanStack Table).

For **custom JWT** projects, swap Better Auth for Passport + `@Authenticated()` RBAC and GraphQL login mutations (storeos pattern).

## Source of truth

| Area | Production app |
| --- | --- |
| Console UI (forms, tables, sheets) | `console.banik.app` |
| Monorepo + Better Auth | `waland` |
| Custom JWT + GraphQL auth | `storeos` |

When production apps evolve, port changes here and bump the skill pack version. Target projects should not hand-edit copied foundation files — upstream improvements through this repo.
