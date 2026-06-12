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

Skills install to `.agents/skills/`. Scaffold skills reference paths like `gl-console-patterns/templates/...` and `gl-workspace-setup/templates/...` — **install `--all`**, not isolated skills.

> **Migrating from v1.x:** all skills were renamed with a `gl-` prefix in v2.0.0 (e.g. `new-module` → `gl-console-module`, `setup-workspace` → `gl-workspace-setup`, `setup-foundation` → `gl-console-setup`, `ui-patterns` → `gl-console-patterns`). Remove the old skills and re-install `--all`.

## What's inside

### `frontend/` — React console patterns

| Skill | What it does |
| --- | --- |
| `gl-console-patterns` | Frontend guideline — forms, `DataTable`, sheets, data layer, hooks. Auto-loaded when relevant. |
| `gl-console-setup` | Bootstrap foundation into an **existing** app (not needed after `gl-workspace-setup`). |
| `gl-console-module` | Scaffold a CRUD list module. |
| `gl-console-form-page` | Scaffold a full-page form. |
| `gl-console-view-sheet` | Scaffold a read-only detail sheet. |
| `gl-console-graphql-util` | Generate `~util.ts` with GQL + Zod. |

### `backend/` — NestJS API patterns

| Skill | What it does |
| --- | --- |
| `gl-api-patterns` | Backend guideline — modules, DTOs, pagination, Better Auth. Auto-loaded when relevant. |
| `gl-api-module` | Scaffold CRUD module (**Better Auth only**). |

### `fullstack/` — monorepo

| Skill | What it does |
| --- | --- |
| `gl-workspace-setup` | Bootstrap monorepo from **bundled templates** in `skills/fullstack/gl-workspace-setup/templates/`. |

## Bundled templates (`gl-workspace-setup/templates/`)

| Template | Auth | Use when |
| --- | --- | --- |
| `api/` + `console/` | Better Auth | Default — sessions, org plugin, social login |
| `api-jwt/` + `console-jwt/` | Custom JWT | Passport, `@Authenticated()` RBAC, `x-tenant`, GraphQL login |
| `package.json`, `mprocs.yaml`, `docker-compose.yml` | — | Monorepo root |

See `skills/fullstack/gl-workspace-setup/templates/README.md` for the full map.

Also bundled in sibling skills: `gl-console-patterns/templates/` (forms, tables, gql-client), `gl-api-patterns/templates/` (REST modules, common DTOs).

## Sample prompts

### New monorepo (choices inline)

```
Use gl-workspace-setup to bootstrap "acme".

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
/gl-workspace-setup acme
```

### Better Auth (default templates)

```
gl-workspace-setup for "my-app"

Vite, REST, Better Auth. Copy templates/api and templates/console.
Then add Project CRUD with gl-api-module and gl-console-module.
```

### Custom JWT (bundled api-jwt + console-jwt)

```
gl-workspace-setup for "my-saas"

Vite, GraphQL, custom-jwt.
Copy templates/api-jwt and templates/console-jwt.
Feature resolvers use @Authenticated() from the bundled authorization decorators.
```

### Next.js console

```
gl-workspace-setup for "acme-admin"

Next.js, REST, Better Auth. Use gl-console-setup + gl-console-patterns/references/adaptation.md.
```

### Add features later

```
gl-api-module Invoice          # Better Auth REST only
gl-console-module products/Product     # console list module
gl-console-graphql-util Product inventory
```

## Skill-by-skill examples

Realistic prompts for each skill, following one project — **"fleetly"**, a multi-tenant vehicle-rental SaaS.

**`gl-workspace-setup`** — day 0, bootstrap the monorepo:

```
Use gl-workspace-setup to bootstrap "fleetly" — a vehicle rental SaaS.

Console: Vite · API data: REST · Auth: Better Auth · Multi-tenant: yes
Workspace route: garage · API infra: mail, queues

Verify both apps build, then commit the initial scaffold.
```

**`gl-api-module`** — add the first backend resource:

```
/gl-api-module Vehicle

Fields: name (required), plateNumber (unique), dailyRate (number),
status (enum: available | rented | maintenance).
List endpoint: filter by status, text search on name/plateNumber.
```

**`gl-console-module`** — the matching console list page:

```
/gl-console-module vehicles/Vehicle

Columns: name, plateNumber, dailyRate, status (badge).
Filter sheet: status select + dailyRate range.
Wire it to the Vehicle REST endpoints from apps/api.
```

**`gl-console-view-sheet`** — detail panel off the list:

```
/gl-console-view-sheet vehicles/Vehicle

Tabs: Basic Info, Rental History (paginated table), Documents.
Open from the row actions of the vehicle list.
```

**`gl-console-form-page`** — a complex entity that outgrows a sheet:

```
/gl-console-form-page rentals/Rental

Sections: customer info, vehicle picker (async combobox, only
status=available), pricing with line items, notes.
Edit mode loads the rental by id from the route param.
```

**`gl-console-graphql-util`** — data operations without scaffolding UI:

```
/gl-console-graphql-util Rental garage

Operations: paginated list (filter by status + vehicleId), create,
update, and a cancelRental mutation. Zod schema must match the API DTO.
```

**`gl-console-setup`** — adopt the foundation in an app that already exists:

```
We have an existing Vite + TanStack Router app in apps/console.
Run gl-console-setup rest, wire the root providers, and typecheck.
```

**`gl-console-patterns`** — auto-loaded guideline; just describe the UI problem:

```
The vehicle table refetches on every keystroke. Fix the search to use
the URL-synced pattern from gl-console-patterns.
```

**`gl-api-patterns`** — auto-loaded guideline; use it for reviews too:

```
Review apps/api/src/vehicle against gl-api-patterns — DTO validation,
pagination contract, and org scoping on every query.
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
