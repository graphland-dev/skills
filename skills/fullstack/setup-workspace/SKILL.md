---
name: setup-workspace
description: Bootstrap a GraphLand fullstack monorepo — bun workspaces with a NestJS API (apps/api), a React console (apps/console), mprocs, and docker-compose. Asks upfront for console framework (Vite/Next.js), API data (REST/GraphQL/both), auth (Better Auth vs custom JWT), and tenancy (multi-tenant vs single-tenant with configurable workspace route). All reference templates are bundled in ./templates/. Vite consoles always use TanStack Router; all consoles use TanStack Query. Use once when starting a new fullstack project.
argument-hint: <project-name>
disable-model-invocation: true
---

> **Locating sibling skills:** paths like `ui-patterns/...` or `api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Bootstrap a fullstack monorepo using **bundled templates** in `./templates/` (see `./templates/README.md`). Project name from arguments: **$ARGUMENTS** (if empty or not substituted, ask the user).

**Do not scaffold until intake is complete.** Record the answers and branch the steps below.

## 0. Intake — ask these questions first

Ask the user (or infer from `$ARGUMENTS` / conversation when already stated). If anything is unclear, ask — do not guess.

| # | Question | Options | Default when user defers |
| --- | --- | --- | --- |
| 1 | **Project name** | free text | ask |
| 2 | **Console framework** | `vite` · `nextjs` | `vite` |
| 3 | **API data layer** | `rest` · `graphql` · `both` | `rest` |
| 4 | **Auth** | `better-auth` · `custom-jwt` | `better-auth` |
| 5 | **Multi-tenant** | `yes` · `no` | `yes` |
| 6 | **Workspace route** (tenant-user area in console) | URL segment, e.g. `merchant`, `workspace`, `portal` | `merchant` — **only ask when multi-tenant = `yes`** |

**Auth choice explained (ask in plain language):**

- **`better-auth`** — Session-based auth at `/auth/*`, social OAuth. **Multi-tenant:** org plugin + `@OrganizationId()`. **Single-tenant:** session only, no org plugin. **Templates:** `./templates/api/` + `./templates/console/`.
- **`custom-jwt`** — Passport + JWT, bearer tokens, `@Authenticated()` RBAC in API. **Multi-tenant:** `x-tenant` header + tenant membership roles. **Single-tenant:** JWT + user `systemRoles` only — no `x-tenant`, no tenant-scoped `PermissionGuard` branch. **Templates:** `./templates/api-jwt/` + `./templates/console-jwt/`.

If the user picks `custom-jwt`, nudge API data layer toward `graphql` or `both` (`api-jwt` ships with GraphQL identity mutations) — but do not override an explicit REST choice.

**Tenancy explained (ask in plain language):**

- **`yes` (multi-tenant)** — Users belong to one or more tenants/orgs. Console has org/tenant switcher. API scopes data and permissions per active tenant/org. Ask for **workspace route** (default `merchant`) — the URL prefix for the signed-in dashboard, e.g. `/merchant` or `/workspace`. Templates ship `/merchant`; rename per §3A-e when the answer is not `merchant`.
- **`no` (single-tenant)** — One user pool, no org/tenant switcher. **Do not** wire `x-tenant`, tenant membership RBAC, or `@OrganizationId()` / `@TenantName()` on feature handlers. Default dashboard route is `/app` (rename from template `/merchant` per §3A-e).

Confirm back in one line, e.g. *"Scaffolding **acme** — Vite, REST, Better Auth, multi-tenant, workspace `/merchant`."* or *"…single-tenant, workspace `/app`."*

### Non-negotiable stack rules

| Layer | Rule |
| --- | --- |
| **Vite console** | **TanStack Router** (file-based routes, `~` co-location) + **TanStack Query** — never React Router, never raw `fetch` in components |
| **Next.js console** | **App Router** + **TanStack Query** — apply swaps in `ui-patterns/references/adaptation.md` (`_components/`, `_util.ts`, `NEXT_PUBLIC_*` env) |
| **Both frameworks** | **TanStack Query** for all server state; providers wired at the app root |
| **API** | NestJS in every variant; **auth** and **data surface** branch per intake answers |

### How choices affect the scaffold

| Auth | Multi-tenant | API scoping | Console |
| --- | --- | --- | --- |
| `better-auth` | `yes` | `organizationId` via `@OrganizationId()`; org plugin | org switcher, `lib/organizations.ts`, active org in bootstrap |
| `better-auth` | `no` | scope by `userId` only; no `organizationId` on entities | session bootstrap only; remove org switcher |
| `custom-jwt` | `yes` | `x-tenant` + `@TenantName()`; `PermissionGuard` uses `memberships[].roles` | org switcher, `fetchMyTenants`, `setActiveTenantUid`, `x-tenant` on gql-client |
| `custom-jwt` | `no` | `@JwtAuthenticated()` + `@Authenticated()` with `systemRoles` only; **no** `x-tenant`, **no** `@TenantName()` | no tenant header; remove tenant/identity tenant modules from hot path |

| Auth | API template | Console auth client |
| --- | --- | --- |
| `better-auth` | `./templates/api/` | `better-auth/react` (+ `organizationClient()` when multi-tenant) |
| `custom-jwt` | `./templates/api-jwt/` | `./templates/console-jwt/` |

| Console | API data | Console data libs | API data bootstrap |
| --- | --- | --- | --- |
| `vite` | `rest` | `api-client.ts` (cookie session **or** bearer JWT per auth choice) | REST controllers |
| `vite` | `graphql` | `gql-client.ts` + `token-service.ts` when `custom-jwt` | GraphQL module at `/graphql` |
| `vite` | `both` | both clients; `~util.ts` picks per feature | REST + GraphQL |
| `nextjs` | any | `setup-foundation` + `adaptation.md` | same as above |

Substitute `<project>` / `<ProjectName>` / `@<project>/` placeholders throughout copied templates.

**Bundled templates** (all in this repo — see `./templates/README.md`):

| Stack | Copy |
| --- | --- |
| Better Auth + Vite + REST | `./templates/api/` + `./templates/console/` |
| Custom JWT + GraphQL | `./templates/api-jwt/` + `./templates/console-jwt/` |
| GraphQL data-layer conventions | `ui-patterns/references/data-layer.md` |

## 1. Workspace root

Create the project folder, `git init`, then copy from `./templates/`:

| Template | Target | Notes |
| --- | --- | --- |
| `package.json` | `./package.json` | Set `name` to `<project>-monorepo`; workspaces are `apps/*` + `packages/*` |
| `mprocs.yaml` | `./mprocs.yaml` | One proc per app; `bun dev` at root runs them all in a tabbed UI |
| `docker-compose.yml` | `./docker-compose.yml` | MongoDB 8 + Redis 7 with healthchecks for local dev |

Add a root `.gitignore` (node_modules, dist, .env, data/) and a short root `README.md` documenting the chosen stack (console framework, API data layer, auth provider, multi-tenant yes/no, workspace route), quick start (`docker compose up -d`, `bun install`, `bun dev`), and workspace table.

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

**No `src/api/*` feature modules yet** — add REST resources with `new-api-module` (org-scoped via `@OrganizationId()` when multi-tenant; user-scoped when single-tenant — see §2f).

When auth = `custom-jwt`, skip §2b entirely — copy `./templates/api-jwt/` in §2c. **Never mix** Better Auth (`templates/api/`) with JWT (`templates/api-jwt/`).

After copy, apply **§2f** tenancy adjustments before env/verify.

### 2c. Custom JWT foundation (when auth = `custom-jwt`)

Copy **all of `./templates/api-jwt/`** into `apps/api/` (package.json, tsconfig, `src/`). This bundle includes Passport JWT, GraphQL identity modules, and authorization decorators.

**Do not copy** from `./templates/api/` (Better Auth).

**API deps to add:** `@nestjs/passport`, `passport`, `passport-jwt`, `jsonwebtoken`, `bcryptjs`, `@types/passport-jwt`, `@types/bcryptjs`. Add `REDIS_URL` when OTP / forgot-password is needed.

#### Authorization decorators live in the API (bundled in `api-jwt`)

All guards and param decorators are under **`src/authorization/`** in `./templates/api-jwt/`. **Multi-tenant:** console sends `Authorization: Bearer <jwt>` and `x-tenant`. **Single-tenant:** JWT only — strip tenant header wiring (§2f). Permission checks stay server-side.

| Path in template | Exports |
| --- | --- |
| `src/authorization/authorization.module.ts` | `PassportModule` + `JwtStrategy` |
| `src/authorization/passport/JwtStrategy.ts` | JWT validation → `req.user` |
| `src/authorization/decorators/authenticated.decorator.ts` | `AuthenticationGuard`, `@JwtAuthenticated()` |
| `src/authorization/decorators/user.decorator.ts` | `@AuthenticatedUser()` |
| `src/authorization/decorators/tenantID.decorator.ts` | `@TenantName()` from `x-tenant` |
| `src/authorization/authenticated.decorator.ts` | `@Authenticated({ collectionName, privileges })` + `PermissionGuard` |

**Decorator usage on every protected handler** (resolvers and REST controllers):

```ts
// JWT only — no RBAC (e.g. identity__me, change password)
@JwtAuthenticated()
@Query(() => User)
me(@AuthenticatedUser() user: IAuthUser) { ... }

// Multi-tenant only — JWT + tenant-scoped RBAC (default for feature modules)
@Authenticated({ collectionName: 'products', privileges: ['read'] })
@Query(() => ProductList)
products(@AuthenticatedUser() user: IAuthUser, @TenantName() tenant: string) { ... }

// Single-tenant — no @TenantName(), PermissionGuard uses user.systemRoles
@Authenticated({ collectionName: 'products', privileges: ['read'] })
@Query(() => ProductList)
products(@AuthenticatedUser() user: IAuthUser) { ... }
```

`@Authenticated()` composes `AuthenticationGuard` + optional `PermissionGuard`. **Multi-tenant:** `PermissionGuard` reads `x-tenant`, resolves `memberships[].roles`. **Single-tenant:** omit `x-tenant`; `PermissionGuard` falls through to `user.systemRoles` (already in template). Do not use `@TenantName()` or `filterWithTenant()` on feature handlers when single-tenant.

**Never substitute** Better Auth decorators on `custom-jwt` projects:

| Do not use (`templates/api/`) | Use instead (`templates/api-jwt/`) |
| --- | --- |
| `@UserSessionGuard()` | `@JwtAuthenticated()` or `@Authenticated({ ... })` |
| `@OrganizationId()` | multi-tenant: `@TenantName()` + tenant filter · single-tenant: user id from JWT/session only |
| `api-patterns/references/auth.md` | `api-jwt/src/authorization/` + `api-jwt/src/api/identity/` |

#### Identity modules (included in `api-jwt`)

| Path | Purpose |
| --- | --- |
| `src/api/identity/auth/` | `identity__login`, `identity__signup`, JWT signing |
| `src/api/identity/user/` | `identity__me`, user profile |
| `src/api/identity/roles/` | `identity__Role` for `PermissionGuard` |
| `src/api/identity/tenant/` | tenant CRUD / membership |
| `src/entities/identity/` | `User`, `Tenant`, `Role`, `Permission` |

**Feature modules:** hand-scaffold with `@Authenticated()` — **do not** use `new-api-module`.

### 2d. GraphQL layer (when API data = `graphql` or `both`)

After REST foundation is in place:

1. Install `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`.
2. Add `GraphQLModule.forRoot` in `AppModule` (code-first or schema-first — match the org's existing Nest GraphQL convention if one exists; otherwise code-first with auto schema).
3. Mount at `/graphql`; enable playground/introspection in development.
4. Scoping on resolvers (respect `multiTenant` from §0):
   - `better-auth` + multi-tenant → `@UserSessionGuard()` + `@OrganizationId()`
   - `better-auth` + single-tenant → `@UserSessionGuard()` + user id from session only
   - `custom-jwt` + multi-tenant → `@Authenticated({ collectionName, privileges })` + `@TenantName()`
   - `custom-jwt` + single-tenant → `@Authenticated({ collectionName, privileges })` + `@AuthenticatedUser()` only (no `@TenantName()`)
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

### 2f. Tenancy adjustments (apply after §2b/§2c and before verify)

Record intake: `multiTenant` (`yes`|`no`), `workspacePath` (URL segment).

#### Multi-tenant = `no` (single-tenant)

**Better Auth API (`templates/api/`):**

1. Remove `organization()` from Better Auth plugins in `src/auth/create-auth.ts`; keep `openAPI()`, `bearer()`.
2. Remove or disable hooks that create/join orgs (`UserCreateHook` personal org, org invitation mail services).
3. Stop registering org-deletion listeners if present.
4. Feature entities: use `userId` (indexed) instead of `organizationId`; services filter by authenticated user id, not org.
5. Controllers: `@UserSessionGuard()` only — **do not** use `@OrganizationId()` or `@ApiKeyGuard()` org scoping unless M2M keys are explicitly requested later.
6. Remove `api_keys` org-scoped collection wiring if not needed.

**Custom JWT API (`templates/api-jwt/`):**

1. Do **not** send or require `x-tenant` anywhere.
2. Remove `@TenantName()` from identity/feature resolvers; drop `filterWithTenant()` — filter by `user.sub` / owner fields instead.
3. Keep `TenantModule` out of feature paths or remove tenant CRUD resolvers if unused; signup creates a user with `systemRoles` only (no `memberships`).
4. `PermissionGuard`: rely on the existing no-`x-tenant` branch (`user.systemRoles`) — remove tenant-membership checks from new code.
5. Drop tenant invitation / add-user-to-tenant mutations unless the product later becomes multi-tenant.

**Both auth variants:** document in root README that the project is single-tenant.

#### Multi-tenant = `yes`

Keep org/tenant wiring from templates. If `workspacePath` ≠ `merchant`, apply console renames in §3A-e (API paths unchanged).

## 3. apps/console

### Branch A — `vite` (default)

Copy `./templates/console/` (Better Auth) or `./templates/console-jwt/` (custom JWT) — Vite + **TanStack Router** + **TanStack Query** + shadcn foundation.

#### 3A-a. Copy app skeleton

1. Copy `./templates/console/` (Better Auth) or `./templates/console-jwt/` (custom JWT) into `apps/console/`.
2. Set `package.json` `name` to `@<project>/console`.
3. Replace branding placeholders with the project name.
4. Verify `vite.config.ts` includes `@tanstack/router-plugin` with `routeFileIgnorePrefix: "~"`.
5. **Auth-specific adjustments** (see §3A-d).
6. **Tenancy + workspace route** (see §3A-e) — rename `/merchant` when needed; strip org/tenant UI when single-tenant.

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
| `custom-jwt` | Use `./templates/console-jwt/` as-is | `TokenService`, `gql-client.ts`, `identity.ts`, `/auth/login` | Bootstrap via `providers/bootstrap.tsx` + `identity__me` / `identity__myTenants` |

`console-jwt` already excludes Better Auth. Login is at `/auth/login` (email/password → JWT).

| Multi-tenant | Console behavior |
| --- | --- |
| `yes` | Keep org switcher, `fetchMyTenants`, `select-organization` route, `setActiveTenantUid()`, `x-tenant` in `gql-client.ts` |
| `no` | Remove org switcher, `select-organization`, tenant bootstrap; `gql-client.ts` sends JWT only (no `x-tenant`); `currentOrganization` stays null in router context |

#### 3A-e. Workspace route + single-tenant console cleanup

Templates default to `/merchant`. Set `workspacePath` from intake:

| Multi-tenant | Default `workspacePath` | Example dashboard URL |
| --- | --- | --- |
| `yes` | `merchant` | `/merchant` (Better Auth) or `/merchant` + tenant uid in path when using JWT path-based tenant (see `console-jwt` bootstrap) |
| `no` | `app` | `/app` |

When `workspacePath` is not `merchant`, rename across **both** console templates:

1. `src/routes/merchant.tsx` → `src/routes/<workspacePath>.tsx`
2. `src/routes/merchant/` → `src/routes/<workspacePath>/`
3. Update `createFileRoute("/merchant")` → `createFileRoute("/<workspacePath>")` and lazy route paths.
4. Replace hardcoded `/merchant` in: `index.tsx` (root redirect), `post-login-redirect.ts`, `app-sidebar.tsx`, `site-header.tsx`, `access-denied.tsx`, `account-shell.tsx`, `docs/module.md`.
5. **JWT only:** update regex in `bootstrap.ts` and `gql-client.ts` (`/^\/merchant\/([^/]+)/` → `/^\/<workspacePath>\/([^/]+)/` when path-based tenant uid is kept).

**Single-tenant console (both templates):**

1. Remove `OrgSwitcher` from `app-sidebar.tsx` (header/footer); remove `create-organization-dialog.tsx` and `lib/organizations.ts` (Better Auth).
2. Remove `routes/select-organization/` (`console-jwt`).
3. Simplify `lib/bootstrap.ts`: session user only; `currentOrganization: null`, `currentMemberRole: null`.
4. Update copy on overview page (no "organization" wording).
5. Better Auth: remove `organizationClient()` from `lib/auth.ts` if unused.

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
6. Port dashboard shell, access page, and route guards using Next middleware or layout `redirect()` for auth — `/access`, `/<workspacePath>`, `/account` (defaults: multi-tenant → `/merchant`, single-tenant → `/app`).
7. **TanStack Query only** for data fetching — do not introduce React Router.

Env: `NEXT_PUBLIC_API_URL=http://localhost:4001` in `apps/console/.env.local`.

## 4. Verify

1. `docker compose up -d` — mongo + redis healthy.
2. `bun install` at the root.
3. `bun dev` — mprocs shows api + console.
4. API **4001**: `/health`, Swagger `/docs`; Better Auth at `/auth/reference` **or** JWT login mutation/endpoint when `custom-jwt`; GraphQL `/graphql` when enabled.
5. Console loads; unauthenticated users hit login (`/access` or `/auth/login`); after sign-in, land on `/<workspacePath>` (multi-tenant default `/merchant`, single-tenant default `/app`).
6. Typecheck + build both apps.

## 5. Next steps

Record the full intake (framework, API data, auth, multi-tenant, workspace path) in the root README, then scaffold the first feature:

| Auth | Tenancy | API data | API | Console |
| --- | --- | --- | --- | --- |
| `better-auth` | multi | `rest` | `new-api-module` (`@OrganizationId()`) | `new-module` |
| `better-auth` | single | `rest` | `new-api-module` adapted to `userId` scoping | `new-module` |
| `better-auth` | multi | `graphql` | GraphQL + `@OrganizationId()` | `new-module` |
| `custom-jwt` | multi | `graphql` | `@Authenticated()` + `@TenantName()` | `new-module`; client sends `x-tenant` |
| `custom-jwt` | single | `graphql` | `@Authenticated()` only (systemRoles) | `new-module`; no `x-tenant` |
| `custom-jwt` | either | `rest` | REST + `@Authenticated()` | `new-module` with REST `~util.ts` |

`new-api-module` is **Better Auth only**. For `custom-jwt`, use decorators from `./templates/api-jwt/src/authorization/`.

For Vite + `better-auth` consoles created by this skill, **do not** re-run `setup-foundation` — foundation is already in `./templates/console/`. Use `setup-foundation` for Next.js consoles or late additions to existing apps.
