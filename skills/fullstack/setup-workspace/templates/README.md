# setup-workspace templates

All reference code for greenfield monorepos lives in this directory. **No external repos are required** — copy from here when running the `setup-workspace` skill.

**Maintainers:** do not run `bun install` / `npm install` inside `templates/` in this repo. Templates ship source only (`package.json`, lockfiles are created in the **scaffolded** project after copy). Never commit `node_modules/`, `dist/`, or lockfiles under `templates/`.

## Layout

| Directory | Auth | Console | API data |
| --- | --- | --- | --- |
| `api/` | Better Auth | — | REST (+ optional GraphQL per skill §2d) |
| `console/` | Better Auth | Vite + TanStack Router | REST (`api-client.ts`) |
| `api-jwt/` | Custom JWT (Passport) | — | GraphQL (`/graphql`) |
| `console-jwt/` | Custom JWT | Vite + TanStack Router | GraphQL (`gql-client.ts`) |
| `package.json`, `mprocs.yaml`, `docker-compose.yml` | — | Monorepo root | — |

## Also in this skill pack (sibling skills)

| Path | Use |
| --- | --- |
| `ui-patterns/templates/` | Form/table/hooks, optional `gql-client.ts`, `token-service.ts` |
| `api-patterns/templates/` | REST feature module example, common DTOs/filters |

## Which template pair to copy

| Intake auth | Intake console | Copy |
| --- | --- | --- |
| `better-auth` | `vite` | `api/` + `console/` |
| `custom-jwt` | `vite` | `api-jwt/` + `console-jwt/` |
| `better-auth` | `nextjs` | `api/` + scaffold Next manually + `setup-foundation` skill |
| `custom-jwt` | `nextjs` | `api-jwt/` + adapt `console-jwt/src/lib/*` to Next |

Templates ship **multi-tenant** defaults (`/merchant`, org switcher, `x-tenant` on JWT). For **single-tenant** projects, follow `setup-workspace` skill §2f and §3A-e to strip org/tenant wiring and rename the workspace route (default single-tenant path: `/app`).

**Optional API infra** (`mail`, `redis`, `queues`, `sms`) is bundled but not required — intake question 7 controls what to keep. See skill §2g for strip instructions. `api-jwt` wires mail+redis by default; `api` wires mail for org invitations.

## `api/` — Better Auth API

- `nest-cli.json` — `entryFile: "apps/api/src/main"` (required in bun monorepos); MJML assets under `common/mail/emails-templates/`
- `src/auth/` — Better Auth + organization plugin
- `src/authorization/` — `UserSessionGuard`, `@OrganizationId()`
- `src/common/` — database, mail, pagination, filters
- `src/config/` — Joi-validated env

## `api-jwt/` — Custom JWT API

- `nest-cli.json` — same `entryFile` / MJML assets pattern as `api/`
- `src/authorization/` — `@JwtAuthenticated()`, `@Authenticated()`, `@AuthenticatedUser()`, `@TenantName()`, `PermissionGuard`
- `src/api/identity/` — auth, user, roles, tenant GraphQL modules
- `src/entities/identity/` — User, Tenant, Role, Permission
- `src/common/` — database, redis, mail, GraphQL DTOs/utils

## `console/` — Better Auth Vite console

- TanStack Router + Query, dashboard shell, `/access` social login
- `src/lib/auth.ts`, `bootstrap.ts`, `api-client.ts` (cookie session)

## `console-jwt/` — Custom JWT Vite console

- `/auth/login` email/password, `TokenService`, `gql-client.ts`
- `src/lib/identity.ts` — login, me, tenants
- No Better Auth dependency
- `.env.example`: `VITE_API_URL`, `VITE_APP_NAME`

## Customization

After copying templates, set `APP_NAME` (API) and `VITE_APP_NAME` (console) to your product name. Email templates use `{{appName}}` from `APP_NAME`.
