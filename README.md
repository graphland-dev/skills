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
Multi-tenant: yes
Workspace route: merchant
API infra: mail

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
| Multi-tenant | `yes` · `no` | `yes` |
| Workspace route | URL segment for signed-in dashboard | `merchant` if multi-tenant · `app` if single-tenant |
| API infra | `mail` · `redis` · `queues` · `sms` (multi-select) | Better Auth multi-tenant → `mail`; custom-jwt → `mail`+`redis`; else none |

**Stack rules:** Vite → TanStack Router + TanStack Query. Next.js → App Router + TanStack Query.

| Auth | Multi-tenant | Templates | Tenancy |
| --- | --- | --- | --- |
| `better-auth` | yes | `templates/api/` + `templates/console/` | org plugin, `@OrganizationId()` |
| `better-auth` | no | same templates, stripped per skill §2f | session + `userId` scoping only |
| `custom-jwt` | yes | `templates/api-jwt/` + `templates/console-jwt/` | `x-tenant`, tenant membership RBAC |
| `custom-jwt` | no | same templates, stripped per skill §2f | JWT + `systemRoles` only, no `x-tenant` |

## Architecture

**Better Auth path:** bun workspace, NestJS API, Vite console with TanStack Router/Query, shadcn, sheet CRUD, `DataTable`. Multi-tenant adds org plugin + org switcher; single-tenant drops org/tenant scoping.

**Custom JWT path:** GraphQL API with Passport + `@Authenticated()` RBAC. Multi-tenant adds `x-tenant` and tenant membership permissions; single-tenant uses user-level roles only.

## Maintaining this repo

Production apps (waland, storeos, Banik) are **upstream sources** when improving templates — port changes into `skills/**/templates/` and bump the skill pack version. Consumers copy from this public repo only; they should not need access to private codebases.

**Do not commit** `node_modules/`, `dist/`, or lockfiles under `skills/**/templates/` — templates are copied as source; dependencies install in the user's new project.
