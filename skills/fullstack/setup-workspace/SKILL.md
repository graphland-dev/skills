---
name: setup-workspace
description: Bootstrap a GraphLand fullstack monorepo — bun workspaces with a NestJS API (apps/api), a React console (apps/console), mprocs, and docker-compose. Asks upfront for console framework (Vite/Next.js) and API style (REST/GraphQL/both). Vite consoles always use TanStack Router; all consoles use TanStack Query. Use once when starting a new fullstack project.
argument-hint: <project-name>
disable-model-invocation: true
---

> **Locating sibling skills:** paths like `ui-patterns/...` or `api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Bootstrap a fullstack monorepo following the **waland** reference architecture. Project name from arguments: **$ARGUMENTS** (if empty or not substituted, ask the user).

**Do not scaffold until intake is complete.** Record the answers and branch the steps below.

## 0. Intake — ask these questions first

Ask the user (or infer from `$ARGUMENTS` / conversation when already stated). If anything is unclear, ask — do not guess.

| # | Question | Options | Default when user defers |
| --- | --- | --- | --- |
| 1 | **Project name** | free text | ask |
| 2 | **Console framework** | `vite` · `nextjs` | `vite` (waland reference) |
| 3 | **API data layer** | `rest` · `graphql` · `both` | `rest` (waland reference) |

Confirm back in one line, e.g. *"Scaffolding **acme** — Vite console, REST API."*

### Non-negotiable stack rules

| Layer | Rule |
| --- | --- |
| **Vite console** | **TanStack Router** (file-based routes, `~` co-location) + **TanStack Query** — never React Router, never raw `fetch` in components |
| **Next.js console** | **App Router** + **TanStack Query** — apply swaps in `ui-patterns/references/adaptation.md` (`_components/`, `_util.ts`, `NEXT_PUBLIC_*` env) |
| **Both frameworks** | **TanStack Query** for all server state; providers wired at the app root |
| **API** | NestJS + Better Auth + org multi-tenancy in every variant; only the **feature data surface** changes (REST controllers vs GraphQL resolvers vs both) |

### How choices affect the scaffold

| Console | API | Console data layer | API bootstrap |
| --- | --- | --- | --- |
| `vite` | `rest` | `./templates/console/` + `api-client.ts` | `./templates/api/` (REST only) |
| `vite` | `graphql` | `./templates/console/` + `gql-client.ts` from `ui-patterns/templates/lib/` | `./templates/api/` + GraphQL module at `/graphql` |
| `vite` | `both` | both clients; `~util.ts` picks REST or GQL per feature | REST foundation + GraphQL module |
| `nextjs` | `rest` | Next App Router shell + `setup-foundation rest` + adaptation | `./templates/api/` |
| `nextjs` | `graphql` | Next shell + `setup-foundation graphql` + adaptation | `./templates/api/` + GraphQL |
| `nextjs` | `both` | both clients via `setup-foundation` + adaptation | REST + GraphQL |

Substitute `<project>` / `<ProjectName>` / `@<project>/` placeholders throughout copied templates.

**Reference apps:** `waland/apps/api` + `waland/apps/console` (Vite + REST). GraphQL patterns live in `ui-patterns/references/data-layer.md`.

## 1. Workspace root

Create the project folder, `git init`, then copy from `./templates/`:

| Template | Target | Notes |
| --- | --- | --- |
| `package.json` | `./package.json` | Set `name` to `<project>-monorepo`; workspaces are `apps/*` + `packages/*` |
| `mprocs.yaml` | `./mprocs.yaml` | One proc per app; `bun dev` at root runs them all in a tabbed UI |
| `docker-compose.yml` | `./docker-compose.yml` | MongoDB 8 + Redis 7 with healthchecks for local dev |

Add a root `.gitignore` (node_modules, dist, .env, data/) and a short root `README.md` documenting the chosen stack (console framework + API style), quick start (`docker compose up -d`, `bun install`, `bun dev`), and workspace table.

## 2. apps/api — NestJS + Better Auth

Do **not** ship bare `nest new` output — merge the foundation from `./templates/api/`.

### 2a. Scaffold shell

1. `bunx @nestjs/cli new api` into `apps/` (skip git; delete any nested lockfile).
2. Copy `./templates/api/package.json` → `apps/api/package.json` — set `name` to `@<project>/api`.
3. Copy `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json` from the template.
4. Ensure `@/` → `src/` path alias and build script `nest build && tsc-alias -p tsconfig.build.json`.

### 2b. Copy REST foundation

Copy `./templates/api/src/` into `apps/api/src/`, replacing generated `app.module.ts`, `main.ts`, and `app.controller.ts`:

| Area | What it wires |
| --- | --- |
| `main.ts` | `bodyParser: false` (Better Auth), ValidationPipe, HttpExceptionFilter, CORS, Swagger at `/docs`, port **4001** |
| `config/` | Modular factories + Joi `env.validation.ts` |
| `auth/` | Better Auth + `organization()` plugin |
| `authorization/` | `UserSessionGuard` + `@OrganizationId()` |
| `common/` | Database, filters, pagination DTOs, optional mail |
| `app.controller.ts` | HATEOAS root + `/health` |

**No `src/api/*` feature modules yet** — add REST resources with `new-api-module`.

### 2c. GraphQL layer (when API = `graphql` or `both`)

After REST foundation is in place:

1. Install `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`.
2. Add `GraphQLModule.forRoot` in `AppModule` (code-first or schema-first — match the org's existing Nest GraphQL convention if one exists; otherwise code-first with auto schema).
3. Mount at `/graphql`; enable playground/introspection in development.
4. Org scoping: resolvers receive `organizationId` from `@UserSessionGuard` / session context — same tenancy rules as REST (`api-patterns/references/auth.md`).
5. Pagination: expose the same meta shape the console `DataTable` expects (`totalCount`, `totalPages`, etc.) — see `ui-patterns/references/data-layer.md` for the GraphQL list contract.
6. When `both`: keep REST controllers for auth/M2M/simple resources; add GraphQL for console list/mutation-heavy features. Document which surface each new module uses in the root README.

### 2d. Environment

1. Copy `./templates/api/.env.example` → `apps/api/.env.example` and `apps/api/.env`.
2. Set `MONGODB_URI=mongodb://localhost:27017/<project>`, `BETTER_AUTH_URL=http://localhost:4001`.
3. Set console origin in `TRUSTED_ORIGINS` and `CORS_ORIGIN`:
   - Vite: `http://localhost:5173`
   - Next.js: `http://localhost:3000`
4. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.
5. Add OAuth client ID/secret pairs when social login is needed.

## 3. apps/console

### Branch A — `vite` (default)

Copy `./templates/console/` — waland's Vite + **TanStack Router** + **TanStack Query** + shadcn foundation.

#### 3A-a. Copy app skeleton

1. Copy all of `./templates/console/` into `apps/console/`.
2. Set `package.json` `name` to `@<project>/console`.
3. Replace branding placeholders with the project name.
4. Verify `vite.config.ts` includes `@tanstack/router-plugin` with `routeFileIgnorePrefix: "~"`.

#### 3A-b. Install + shadcn

```bash
bun install   # from monorepo root
cd apps/console
npx shadcn@latest init -y
npx shadcn@latest add button input textarea label checkbox radio-group sheet dialog table popover select card separator skeleton tooltip dropdown-menu sidebar avatar badge tabs switch field drawer calendar sonner breadcrumb password-input otp-input
```

#### 3A-c. Data layer by API choice

| API choice | Console lib | Env var |
| --- | --- | --- |
| `rest` | Keep `src/lib/api-client.ts` | `VITE_API_URL=http://localhost:4001` |
| `graphql` | Copy `ui-patterns/templates/lib/gql-client.ts` + `token-service.ts` → `src/lib/`; remove or ignore `api-client.ts` for feature data | `VITE_API_URL=http://localhost:4001` (client appends `/graphql`) |
| `both` | Keep **both** clients; feature `~util.ts` files use one or the other | `VITE_API_URL=http://localhost:4001` |

Better Auth always uses `VITE_API_URL` + `/auth` regardless of data layer.

`routeTree.gen.ts` is auto-generated on first `bun run dev` — do not hand-author.

### Branch B — `nextjs`

No Vite template — scaffold App Router, then apply GraphLand foundation.

1. `bunx create-next-app@latest console` in `apps/` (TypeScript, App Router, Tailwind, `@/*` alias, no src dir unless the team prefers it).
2. Install: `@tanstack/react-query`, `@tanstack/react-table`, `better-auth`, plus shadcn deps.
3. Run the `setup-foundation` skill with `rest`, `graphql`, or note `both` (run foundation with the primary layer, then add the second client manually):
   - `rest` → `setup-foundation rest`
   - `graphql` → `setup-foundation graphql`
   - `both` → `setup-foundation graphql` then also copy `api-client.ts` pattern from `./templates/console/src/lib/api-client.ts`
4. Read and apply `ui-patterns/references/adaptation.md`:
   - `"use client"` on interactive pages
   - `_components/` + `_util.ts` instead of `~`
   - `NEXT_PUBLIC_API_URL` instead of `VITE_API_URL`
   - Providers in a client layout wrapper
5. Port the **bootstrap pattern** from `./templates/console/src/main.tsx` + `lib/bootstrap.ts` into a client layout/provider (session → org → role context via React context or TanStack Query, not TanStack Router).
6. Port dashboard shell, access page, and route guards using Next middleware or layout `redirect()` for auth — same URLs: `/access`, `/merchant`, `/account`.
7. **TanStack Query only** for data fetching — do not introduce React Router.

Env: `NEXT_PUBLIC_API_URL=http://localhost:4001` in `apps/console/.env.local`.

## 4. Verify

1. `docker compose up -d` — mongo + redis healthy.
2. `bun install` at the root.
3. `bun dev` — mprocs shows api + console.
4. API **4001**: `/health`, Swagger `/docs`, Better Auth `/auth/reference`; GraphQL `/graphql` when enabled.
5. Console loads; unauthenticated users hit `/access`; after sign-in, land on `/merchant`.
6. Typecheck + build both apps.

## 5. Next steps

Record the chosen stack in the root README, then scaffold the first feature:

| API style | API skill | Console skill | Notes |
| --- | --- | --- | --- |
| `rest` | `new-api-module` | `new-module` | Default waland path |
| `graphql` | GraphQL resolvers (manual) + `new-graphql-util` | `new-module` with GQL `~util.ts` | Apply `ui-patterns/references/data-layer.md` |
| `both` | `new-api-module` + GraphQL types for same entity | `new-module` — pick client per feature | Document per-entity choice |

For Vite consoles created by this skill, **do not** re-run `setup-foundation` — foundation is already included. Use `setup-foundation` only for Next.js consoles or late additions to existing apps.
