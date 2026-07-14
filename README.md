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

### Invoking a skill (works in any agent)

These are standard [Agent Skills](https://agentskills.io) — they work in Claude Code, Cursor, opencode, Codex, Gemini CLI, and any other skills-compatible agent. There's no slash command to memorize: just **name the skill in plain language** and the agent loads it. The two guideline skills (`gl-api-patterns`, `gl-console-patterns`) load automatically when a task matches; the rest are run on request.

```
Use gl-workspace-setup to bootstrap "acme".
Scaffold a Vehicle module with gl-api-module.
```

If your agent has slash-command syntax for skills (Claude Code, Cursor), `/gl-workspace-setup acme` works too — but it's just shorthand for naming the skill. The prompts below use the plain-language form so they're copy-pasteable in any agent.

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
| `gl-console-deploy` | Deploy the console to Cloudflare Workers and attach its custom domain — Vite as static assets, Next.js via [OpenNext](https://opennext.js.org/cloudflare). |

### `backend/` — NestJS API patterns

| Skill | What it does |
| --- | --- |
| `gl-api-patterns` | Backend guideline — modules, DTOs, pagination, Better Auth. Auto-loaded when relevant. |
| `gl-api-module` | Scaffold CRUD module (**Better Auth only**). |
| `gl-billing-patterns` | Subscription/entitlement guideline — shared plans package, computed entitlements, `EntitlementService.assert*` enforcement, gateway-agnostic payments + webhooks. Auto-loaded when relevant. |
| `gl-billing-module` | Add subscriptions, plans, paywalls, usage limits, and feature gating to a project (API + shared package + console gates). |

### `fullstack/` — monorepo

| Skill | What it does |
| --- | --- |
| `gl-workspace-setup` | Bootstrap monorepo from **bundled templates** in `skills/fullstack/gl-workspace-setup/templates/`. |

### `general/` — cross-cutting workflows

| Skill | What it does |
| --- | --- |
| `gl-review` | Review a PR/branch/diff against the GraphLand guidelines (tenancy scoping, DTO validation, table/form patterns). |
| `gl-release-notes` | Write release notes from git history and merged PRs; update `CHANGELOG.md` or draft a GitHub release. |

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
Use gl-workspace-setup to bootstrap acme (let me answer the intake questions).
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
Use gl-api-module to scaffold a Vehicle module.

Fields: name (required), plateNumber (unique), dailyRate (number),
status (enum: available | rented | maintenance).
List endpoint: filter by status, text search on name/plateNumber.
```

**`gl-console-module`** — the matching console list page:

```
Use gl-console-module for vehicles/Vehicle.

Columns: name, plateNumber, dailyRate, status (badge).
Filter sheet: status select + dailyRate range.
Wire it to the Vehicle REST endpoints from apps/api.
```

**`gl-console-view-sheet`** — detail panel off the list:

```
Use gl-console-view-sheet for vehicles/Vehicle.

Tabs: Basic Info, Rental History (paginated table), Documents.
Open from the row actions of the vehicle list.
```

**`gl-console-form-page`** — a complex entity that outgrows a sheet:

```
Use gl-console-form-page for rentals/Rental.

Sections: customer info, vehicle picker (async combobox, only
status=available), pricing with line items, notes.
Edit mode loads the rental by id from the route param.
```

**`gl-console-graphql-util`** — data operations without scaffolding UI:

```
Use gl-console-graphql-util for Rental in the garage namespace.

Operations: paginated list (filter by status + vehicleId), create,
update, and a cancelRental mutation. Zod schema must match the API DTO.
```

**`gl-console-deploy`** — ship the console to Cloudflare:

```
Use gl-console-deploy for apps/console.

Deploy to Cloudflare Workers on console.fleetly.app (zone is already on
our account). Production API is https://api.fleetly.app — set
VITE_BACKEND_BASE_URL before the build. Verify a deep route survives a
hard refresh on the custom domain.
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

**`gl-review`** — guideline review of a whole change before merging:

```
Use gl-review on PR 42.

The PR adds rental cancellation. Pay extra attention to tenant scoping
on the new queries and the cancelRental mutation.
```

**`gl-release-notes`** — cut a release:

```
Use gl-release-notes for v1.4.0.

Customer-facing notes for everything since v1.3.0. Update CHANGELOG.md
and draft the GitHub release.
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
