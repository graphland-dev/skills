# Auth & multi-tenancy — Better Auth + org-scoped guards

> **Single-tenant projects:** skip the org plugin, `@OrganizationId()`, and `organizationId` on entities. Scope by authenticated `userId` instead. See `gl-workspace-setup` skill §2f.

## The model

- **Better Auth** (`better-auth` + `@thallesp/nestjs-better-auth`) owns users, sessions, and organizations: email/password plus optional GitHub/Google OAuth, with the `organization()` plugin providing orgs, invitations, and roles (owner/member). Auth endpoints mount under `/auth/*`; an OpenAPI reference is served at `/auth/reference`.
- **Two credentials**, two guards:
  - `@UserSessionGuard()` — dashboard/browser calls; bearer session token from `/auth/sign-in`.
  - `@ApiKeyGuard()` — machine-to-machine; org-scoped API key (`Authorization: Bearer <prefix>_<key>` or `x-api-key`), stored hashed in Mongo.
- Both guards resolve the **active organization** and attach `request.organizationId`; handlers read it via the `@OrganizationId()` param decorator (`templates/common/organization-id.decorator.ts`).

```ts
@Get()
@UserSessionGuard()
findMany(@OrganizationId() organizationId: string, @Query() query: EntityListQueryDto) {
  return this.entityService.findMany(query, organizationId);
}
```

## Org-scoped multi-tenancy rules

1. **Every entity carries `organizationId`** (indexed, required) — see `templates/example-module/entities/entity.entity.ts`.
2. **Every query filters by it.** The service receives `organizationId` as an explicit method parameter and includes it in every repository filter (`{ _id: id, organizationId }`) — a wrong-org id yields 404, never someone else's document.
3. **Never accept `organizationId` from the request body.** It comes only from the guard via the decorator.
4. **Cascade delete**: when an org is deleted (Better Auth hook), each repository exposes `deleteByOrganizationId()` and an org-deletion listener calls them all.

## Setup sketch

Better Auth is configured in `src/auth/create-auth.ts` (plugins: `openAPI()`, `bearer()`, `organization()`), with a Mongo adapter and hooks (`UserCreateHook` to auto-create a personal org, `SessionCreateHook` to set the active org). Required env: `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `TRUSTED_ORIGINS` — validated at boot ([config.md](config.md)). Swagger registers both bearer schemes (see `templates/common/main.ts`).

The guards/decorators are project code (thin wrappers over Better Auth session lookup and an `api_keys` collection). For greenfield projects, copy from `gl-workspace-setup/templates/api/src/authorization/` (bundled in this skill pack). For custom JWT auth, use `gl-workspace-setup/templates/api-jwt/src/authorization/` instead — do not mix the two stacks.

## Frontend pairing

The console uses the Better Auth client (`better-auth/client`) against the same base URL; session bootstrap (user + active org + role) happens once at app start and feeds router context. API keys are for external/SDK consumers only — the console always uses session auth.
