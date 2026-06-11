---
name: setup-workspace
description: Bootstrap a GraphLand fullstack monorepo — bun workspaces with a NestJS API (apps/api), a React console (apps/console), mprocs, and docker-compose. Asks upfront for console framework (Vite/Next.js), API style (REST/GraphQL/both), and auth (Better Auth vs custom JWT like storeos). Vite consoles always use TanStack Router; all consoles use TanStack Query. Use once when starting a new fullstack project.
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
| 4 | **Auth** | `better-auth` · `custom-jwt` | `better-auth` (waland reference) |

**Auth choice explained (ask in plain language):**

- **`better-auth`** — Session-based auth mounted at `/auth/*`, org plugin (`activeOrganizationId` on session), social OAuth, invitation emails. **Reference:** `waland/apps/api` + `waland/apps/console`.
- **`custom-jwt`** — Hand-rolled Passport + `jsonwebtoken`, stateless bearer tokens, tenant via `x-tenant` header, RBAC via Mongo `Role` + `User.memberships[]`. **Reference:** `storeos/apps/core-api` + `storeos/packages/shared-api` + `storeos/apps/web-console`.

If the user picks `custom-jwt`, nudge API data layer toward `graphql` or `both` (storeos exposes login via GraphQL mutations) — but do not override an explicit REST choice.

Confirm back in one line, e.g. *"Scaffolding **acme** — Vite console, REST API, Better Auth."*

### Non-negotiable stack rules

| Layer | Rule |
| --- | --- |
| **Vite console** | **TanStack Router** (file-based routes, `~` co-location) + **TanStack Query** — never React Router, never raw `fetch` in components |
| **Next.js console** | **App Router** + **TanStack Query** — apply swaps in `ui-patterns/references/adaptation.md` (`_components/`, `_util.ts`, `NEXT_PUBLIC_*` env) |
| **Both frameworks** | **TanStack Query** for all server state; providers wired at the app root |
| **API** | NestJS in every variant; **auth** and **data surface** branch per intake answers |

### How choices affect the scaffold

| Auth | API template | Console auth client | Tenancy |
| --- | --- | --- | --- |
| `better-auth` | `./templates/api/` (`auth/`, `UserSessionGuard`, `/auth/*`) | `better-auth/react` + `organizationClient()` — ships in `./templates/console/src/lib/auth.ts` | `organizationId` from session via `@OrganizationId()` |
| `custom-jwt` | Scaffold from **storeos** pattern (see §2c) — **no** `./templates/api/auth/` or `./templates/api/authorization/` | `ui-patterns/templates/lib/token-service.ts` + bearer on `gql-client` / `api-client` | `x-tenant` header + `@Authenticated()` RBAC in API |

| Console | API data | Console data libs | API data bootstrap |
| --- | --- | --- | --- |
| `vite` | `rest` | `api-client.ts` (cookie session **or** bearer JWT per auth choice) | REST controllers |
| `vite` | `graphql` | `gql-client.ts` + `token-service.ts` when `custom-jwt` | GraphQL module at `/graphql` |
| `vite` | `both` | both clients; `~util.ts` picks per feature | REST + GraphQL |
| `nextjs` | any | `setup-foundation` + `adaptation.md` | same as above |

Substitute `<project>` / `<ProjectName>` / `@<project>/` placeholders throughout copied templates.

**Reference apps:**

| Stack | Reference |
| --- | --- |
| Better Auth + Vite + REST | `waland/apps/api` + `waland/apps/console` |
| Custom JWT + GraphQL | `storeos/apps/core-api` + `storeos/packages/shared-api` + `storeos/apps/web-console` |
| GraphQL data-layer conventions | `ui-patterns/references/data-layer.md` |

## 1. Workspace root

Create the project folder, `git init`, then copy from `./templates/`:

| Template | Target | Notes |
| --- | --- | --- |
| `package.json` | `./package.json` | Set `name` to `<project>-monorepo`; workspaces are `apps/*` + `packages/*` |
| `mprocs.yaml` | `./mprocs.yaml` | One proc per app; `bun dev` at root runs them all in a tabbed UI |
| `docker-compose.yml` | `./docker-compose.yml` | MongoDB 8 + Redis 7 with healthchecks for local dev |

Add a root `.gitignore` (node_modules, dist, .env, data/) and a short root `README.md` documenting the chosen stack (console framework, API data layer, auth provider), quick start (`docker compose up -d`, `bun install`, `bun dev`), and workspace table.

## 2. apps/api — NestJS

Do **not** ship bare `nest new` output — merge a foundation matching the **auth** intake answer.

### 2a. Scaffold shell (both auth variants)

1. `bunx @nestjs/cli new api` into `apps/` (skip git; delete any nested lockfile).
2. Set `name` to `@<project>/api` in `package.json`.
3. Ensure `@/` → `src/` path alias and build script `nest build && tsc-alias -p tsconfig.build.json`.
4. Wire shared pieces every variant needs: `ValidationPipe`, `HttpExceptionFilter`, modular `config/` + Joi validation, `DatabaseModule`, Swagger at `/docs`, port **4001**.

### 2b. Better Auth foundation (when auth = `better-auth`)

Copy `./templates/api/` into `apps/api/` (package.json, nest-cli, tsconfig, `src/`). Key areas:

| Area | What it wires |
| --- | --- |
| `main.ts` | `bodyParser: false` (required by `@thallesp/nestjs-better-auth`), CORS, Swagger |
| `auth/` | Better Auth + `organization()` plugin, Mongo adapter, session hooks |
| `authorization/` | `UserSessionGuard` + `@OrganizationId()` |
| `common/` | Database, filters, pagination DTOs, optional mail |
| `app.controller.ts` | HATEOAS root + `/health` |

**No `src/api/*` feature modules yet** — add REST resources with `new-api-module` (org-scoped via `@OrganizationId()`).

When auth = `custom-jwt`, skip §2b entirely — use §2c instead. **Never mix** Better Auth files with the storeos authorization stack.

### 2c. Custom JWT foundation (when auth = `custom-jwt`)

Scaffold from the **storeos** pattern — stateless JWT, Passport, tenant header. Read `storeos/packages/shared-api` and `storeos/apps/core-api` as the source of truth.

**Do not copy** from `./templates/api/`:

- `auth/` (Better Auth)
- `authorization/guards/user-session.guard.ts`, `organization-id.decorator.ts`, or any `@UserSessionGuard` / `@OrganizationId()` usage

**API deps to add:** `@nestjs/passport`, `passport`, `passport-jwt`, `jsonwebtoken`, `bcryptjs`, `@types/passport-jwt`, `@types/bcryptjs`. Add `REDIS_URL` when OTP / forgot-password is needed.

#### Authorization decorators live in the API (storeos pattern)

All auth guards and param decorators stay under **`src/authorization/`** in the API app — same layout as storeos. The console only sends `Authorization: Bearer <jwt>` and `x-tenant`; it never implements permission checks.

**Copy or recreate this tree:**

| Path in `apps/api` | storeos reference | Exports |
| --- | --- | --- |
| `src/authorization/authorization.module.ts` | `packages/shared-api/src/authorization/authorization.module.ts` | `PassportModule` + `JwtStrategy` registered globally |
| `src/authorization/passport/JwtStrategy.ts` | `packages/shared-api/.../JwtStrategy.ts` | Validates JWT → `req.user` payload (`sub`, `email`, …) |
| `src/authorization/decorators/authenticated.decorator.ts` | `packages/shared-api/.../authenticated.decorator.ts` | `AuthenticationGuard`, `@JwtAuthenticated()` |
| `src/authorization/decorators/user.decorator.ts` | `packages/shared-api/.../user.decorator.ts` | `@AuthenticatedUser()` param decorator |
| `src/authorization/decorators/tenantID.decorator.ts` | `packages/shared-api/.../tenantID.decorator.ts` | `@TenantName()` from `x-tenant` header |
| `src/authorization/authenticated.decorator.ts` | `apps/core-api/src/authorization/authenticated.decorator.ts` | `@Authenticated({ collectionName, privileges })` + `PermissionGuard` |

**Decorator usage on every protected handler** (resolvers and REST controllers):

```ts
// JWT only — no RBAC (e.g. identity__me, change password)
@JwtAuthenticated()
@Query(() => User)
me(@AuthenticatedUser() user: IAuthUser) { ... }

// JWT + tenant-scoped RBAC — default for feature modules
@Authenticated({ collectionName: 'products', privileges: ['read'] })
@Query(() => ProductList)
products(@AuthenticatedUser() user: IAuthUser, @TenantName() tenant: string) { ... }
```

`@Authenticated()` composes `AuthenticationGuard` + optional `PermissionGuard`. `PermissionGuard` loads the user from Mongo, reads `x-tenant`, resolves `memberships[].roles`, joins `identity__Role` permissions, and checks `collectionName` + `privileges` metadata — **all server-side in the API**.

**Never substitute** waland/Better Auth decorators on `custom-jwt` projects:

| Do not use (Better Auth) | Use instead (storeos) |
| --- | --- |
| `@UserSessionGuard()` | `@JwtAuthenticated()` or `@Authenticated({ ... })` |
| `@OrganizationId()` | `@TenantName()` + filter queries by tenant UID |
| `api-patterns/references/auth.md` | storeos `authorization/` + `identity/` modules |

#### Identity + auth modules

| Area | storeos reference | Purpose |
| --- | --- | --- |
| `src/api/identity/auth/` | `apps/core-api/src/api/identity/auth/` | `AuthService` (bcrypt + `jwt.sign`), login/signup resolvers or REST controller |
| `src/api/identity/user/` | same tree | `identity__me`, user profile |
| `src/api/identity/roles/` | same tree | `identity__Role` seed + lookup for `PermissionGuard` |
| `src/api/identity/tenant/` | same tree | tenant CRUD / membership |
| Identity entities | `packages/shared-api/src/entities/identity/` | `User`, `Tenant`, `Role`, `Permission`, `memberships[]` embed |

**`main.ts`:** default Nest body parser (no `bodyParser: false`). No `/auth/*` Better Auth mount.

**GraphQL auth mutations** (storeos style): `identity__login`, `identity__signup`, `identity__me` — scaffold before feature modules. When API data = `rest` only, expose equivalent login/me REST endpoints.

**Feature modules:** hand-scaffold resolvers/controllers with `@Authenticated()` — **do not** use `new-api-module` (it emits `@UserSessionGuard` + `@OrganizationId()`).

### 2d. GraphQL layer (when API data = `graphql` or `both`)

After REST foundation is in place:

1. Install `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`.
2. Add `GraphQLModule.forRoot` in `AppModule` (code-first or schema-first — match the org's existing Nest GraphQL convention if one exists; otherwise code-first with auto schema).
3. Mount at `/graphql`; enable playground/introspection in development.
4. Org/tenant scoping on resolvers:
   - `better-auth` → `@UserSessionGuard()` + `@OrganizationId()` (`api-patterns/references/auth.md`)
   - `custom-jwt` → `@Authenticated({ collectionName, privileges })` + `@TenantName()` — authorization decorators stay in `src/authorization/` per §2c
5. Pagination: expose the same meta shape the console `DataTable` expects (`totalCount`, `totalPages`, etc.) — see `ui-patterns/references/data-layer.md`.
6. When `both`: keep REST controllers for M2M/simple resources; add GraphQL for console list/mutation-heavy features. Document which surface each module uses in the root README.

### 2e. Environment

**Better Auth** — copy `./templates/api/.env.example`:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/<project>` |
| `BETTER_AUTH_URL` | `http://localhost:4001` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `TRUSTED_ORIGINS` / `CORS_ORIGIN` | `http://localhost:5173` (Vite) or `http://localhost:3000` (Next) |
| OAuth pairs | optional `GITHUB_*`, `GOOGLE_*` |

**Custom JWT** — do **not** use `BETTER_AUTH_*`. Minimum:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/<project>` |
| `JWT_SECRET` | long random secret (shared across APIs if you add more later) |
| `REDIS_URL` | `redis://localhost:6379` (OTP / password-reset tokens) |
| `CORS_ORIGIN` | console origin |
| `MAIL_*` | optional — forgot-password emails |

## 3. apps/console

### Branch A — `vite` (default)

Copy `./templates/console/` — waland's Vite + **TanStack Router** + **TanStack Query** + shadcn foundation.

#### 3A-a. Copy app skeleton

1. Copy all of `./templates/console/` into `apps/console/`.
2. Set `package.json` `name` to `@<project>/console`.
3. Replace branding placeholders with the project name.
4. Verify `vite.config.ts` includes `@tanstack/router-plugin` with `routeFileIgnorePrefix: "~"`.
5. **Auth-specific adjustments** (see §3A-d).

#### 3A-b. Install + shadcn

```bash
bun install   # from monorepo root
cd apps/console
npx shadcn@latest init -y
npx shadcn@latest add button input textarea label checkbox radio-group sheet dialog table popover select card separator skeleton tooltip dropdown-menu sidebar avatar badge tabs switch field drawer calendar sonner breadcrumb password-input otp-input
```

#### 3A-c. Data layer by API choice

| API data | Console lib | Env var |
| --- | --- | --- |
| `rest` | `src/lib/api-client.ts` | `VITE_API_URL=http://localhost:4001` |
| `graphql` | `ui-patterns/templates/lib/gql-client.ts` → `src/lib/` | `VITE_API_URL` (client appends `/graphql`) |
| `both` | both clients; `~util.ts` picks per feature | `VITE_API_URL` |

#### 3A-d. Auth-specific console wiring

| Auth | Keep from template | Remove / replace | Bootstrap |
| --- | --- | --- | --- |
| `better-auth` | `lib/auth.ts`, `lib/bootstrap.ts`, `lib/organizations.ts`, cookie-based `api-client.ts`, social login on `/access` | — | Session via `auth.getSession()`; org via Better Auth `organizationClient()` |
| `custom-jwt` | dashboard shell, form/table, TanStack Router routes, `api-client` or `gql-client` | **Remove** `lib/auth.ts`, Better Auth dep, social-login `/access` UI | Copy `ui-patterns/templates/lib/token-service.ts`; store JWT in `localStorage`; send `Authorization: Bearer` + `x-tenant` on every API call; bootstrap = `identity__me` + tenant list query (see `storeos/apps/web-console/src/lib/identity.ts`) |

**Custom JWT access page:** email/password (or OTP) form that calls the login mutation/endpoint, saves the token via `tokenService`, then redirects to `/merchant`. No `better-auth/react` client.

**Custom JWT org switcher:** tenant dropdown sets `x-tenant` (tenant UID) on the API client — not `auth.organization.setActive()`.

`routeTree.gen.ts` is auto-generated on first `bun run dev` — do not hand-author.

### Branch B — `nextjs`

No Vite template — scaffold App Router, then apply GraphLand foundation.

1. `bunx create-next-app@latest console` in `apps/` (TypeScript, App Router, Tailwind, `@/*` alias, no src dir unless the team prefers it).
2. Install: `@tanstack/react-query`, `@tanstack/react-table`, plus shadcn deps. Add `better-auth` **only** when auth = `better-auth`.
3. Run the `setup-foundation` skill with `rest`, `graphql`, or `both` (run foundation with the primary layer, then add the second client manually):
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
4. API **4001**: `/health`, Swagger `/docs`; Better Auth at `/auth/reference` **or** JWT login mutation/endpoint when `custom-jwt`; GraphQL `/graphql` when enabled.
5. Console loads; unauthenticated users hit `/access`; after sign-in (OAuth or email/password per auth choice), land on `/merchant`.
6. Typecheck + build both apps.

## 5. Next steps

Record the full intake (framework, API data, auth) in the root README, then scaffold the first feature:

| Auth | API data | API | Console |
| --- | --- | --- | --- |
| `better-auth` | `rest` | `new-api-module` | `new-module` |
| `better-auth` | `graphql` | GraphQL resolvers + `new-graphql-util` | `new-module` |
| `custom-jwt` | `graphql` | identity + feature resolvers with `@Authenticated()` | `new-module` + `new-graphql-util`; client sends `x-tenant` |
| `custom-jwt` | `rest` | REST controllers with `@Authenticated()` | `new-module` with REST `~util.ts` |

`new-api-module` is **Better Auth only** (`@UserSessionGuard`, `@OrganizationId()`). For `custom-jwt`, feature handlers must use the storeos authorization decorators from `src/authorization/` — never port waland guards onto a JWT stack.

For Vite + `better-auth` consoles created by this skill, **do not** re-run `setup-foundation` — foundation is already in `./templates/console/`. Use `setup-foundation` for Next.js consoles or late additions to existing apps.
