# GraphLand Skills

GraphLand's company-wide **fullstack engineering guideline**, packaged as agent skills. **All reference code is bundled in this repo** — no private monorepos required to scaffold a new project.

## Install

**Recommended** — install the full skill pack (scaffold skills depend on sibling templates):

```bash
npx skills add graphland-dev/skills --all -y
```

```bash
npx skills add graphland-dev/skills --all -a cursor -y
npx skills add graphland-dev/skills --list
```

**As a Claude Code plugin** (optional):

```
/plugin marketplace add graphland-dev/skills
/plugin install graphland@graphland
```

Skills install to `.agents/skills/`. Scaffold skills reference paths like `ui-patterns/templates/...` and `setup-workspace/templates/...` — **install `--all`**, not isolated skills.

## What's inside

### `frontend/` — React console patterns

| Skill | What it does |
| --- | --- |
| `ui-patterns` | Frontend guideline — forms, `DataTable`, sheets, data layer, hooks. Auto-loaded when relevant. |
| `setup-foundation` | Bootstrap foundation into an **existing** app (not needed after `setup-workspace`). |
| `new-module` | Scaffold a CRUD list module. |
| `new-form-page` | Scaffold a full-page form. |
| `new-view-sheet` | Scaffold a read-only detail sheet. |
| `new-graphql-util` | Generate `~util.ts` with GQL + Zod. |

### `backend/` — NestJS API patterns

| Skill | What it does |
| --- | --- |
| `api-patterns` | Backend guideline — modules, DTOs, pagination, Better Auth. Auto-loaded when relevant. |
| `new-api-module` | Scaffold CRUD module (**Better Auth only**). |

### `fullstack/` — monorepo

| Skill | What it does |
| --- | --- |
| `setup-workspace` | Bootstrap monorepo from **bundled templates** in `skills/fullstack/setup-workspace/templates/`. |

## Bundled templates (`setup-workspace/templates/`)

| Template | Auth | Use when |
| --- | --- | --- |
| `api/` + `console/` | Better Auth | Default — sessions, org plugin, social login |
| `api-jwt/` + `console-jwt/` | Custom JWT | Passport, `@Authenticated()` RBAC, `x-tenant`, GraphQL login |
| `package.json`, `mprocs.yaml`, `docker-compose.yml` | — | Monorepo root |

See `skills/fullstack/setup-workspace/templates/README.md` for the full map.

Also bundled in sibling skills: `ui-patterns/templates/` (forms, tables, gql-client), `api-patterns/templates/` (REST modules, common DTOs).

## Sample prompts

### New monorepo (choices inline)

```
Use setup-workspace to bootstrap "acme".

Console: Vite
API data: REST
Auth: Better Auth

Copy templates from the skill pack and verify both apps build.
```

### Let the agent ask

```
/setup-workspace acme
```

### Better Auth (default templates)

```
setup-workspace for "my-app"

Vite, REST, Better Auth. Copy templates/api and templates/console.
Then add Project CRUD with new-api-module and new-module.
```

### Custom JWT (bundled api-jwt + console-jwt)

```
setup-workspace for "my-saas"

Vite, GraphQL, custom-jwt.
Copy templates/api-jwt and templates/console-jwt.
Feature resolvers use @Authenticated() from the bundled authorization decorators.
```

### Next.js console

```
setup-workspace for "acme-admin"

Next.js, REST, Better Auth. Use setup-foundation + ui-patterns/references/adaptation.md.
```

### Add features later

```
new-api-module Invoice          # Better Auth REST only
new-module products/Product     # console list module
new-graphql-util Product inventory
```

## Intake cheat sheet

| Question | Options | Default |
| --- | --- | --- |
| Console | `vite` · `nextjs` | `vite` |
| API data | `rest` · `graphql` · `both` | `rest` |
| Auth | `better-auth` · `custom-jwt` | `better-auth` |

**Stack rules:** Vite → TanStack Router + TanStack Query. Next.js → App Router + TanStack Query.

| Auth | Templates to copy |
| --- | --- |
| `better-auth` | `templates/api/` + `templates/console/` |
| `custom-jwt` | `templates/api-jwt/` + `templates/console-jwt/` |

## Architecture

**Better Auth path:** bun workspace, NestJS API with org tenancy, Vite console with TanStack Router/Query, shadcn, sheet CRUD, `DataTable`.

**Custom JWT path:** GraphQL API with Passport + `@Authenticated()` RBAC, console with JWT in localStorage + `x-tenant` header.

## Maintaining this repo

Production apps (waland, storeos, Banik) are **upstream sources** when improving templates — port changes into `skills/**/templates/` and bump the skill pack version. Consumers copy from this public repo only; they should not need access to private codebases.
