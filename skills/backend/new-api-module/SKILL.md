---
name: new-api-module
description: Scaffold a NestJS feature module (controller, service, repository, DTOs, Mongoose entity, contracts, module) following the GraphLand API guideline — org-scoped CRUD with pagination. Use when adding a new resource/endpoint group to a GraphLand backend.
argument-hint: <EntityName>
disable-model-invocation: true
---

Scaffold a feature module following the GraphLand API guideline (`${CLAUDE_PLUGIN_ROOT}/skills/backend/api-patterns/SKILL.md`).

**Arguments:** $ARGUMENTS
**Format:** `<EntityName>` — e.g. `Project` · `Invoice` · `Webhook`

## 0. Preconditions

- Verify this is a NestJS app with the common foundation (`src/common/common-models/pagination.dto.ts`, `src/common/filters/http-exception.filter.ts`, `@/` path alias). If missing, copy the pieces from `${CLAUDE_PLUGIN_ROOT}/skills/backend/api-patterns/templates/common/` first (targets: `common-models/`, `filters/`, `decorators/`, `src/config/`, `src/main.ts` patterns).
- Derive names: `Project` → folder `src/api/project/`, route `v1/projects`, collection `projects`.
- Ask the user for the entity's **fields** (name/type/required) and whether any **status enum** or **cross-field rules** apply; also whether endpoints are dashboard-only (`@UserSessionGuard`), M2M (`@ApiKeyGuard`), or mixed (see `references/auth.md`).

## 1. Generate the module

Copy `${CLAUDE_PLUGIN_ROOT}/skills/backend/api-patterns/templates/example-module/` into `src/api/<feature>/`, substituting every `Entity`/`entity`/`entities` with the real name, then extend with real fields:

| Template file | Fill in |
| --- | --- |
| `entities/entity.entity.ts` | Real `@Prop` fields; keep `organizationId` (required, indexed) and the `{ organizationId, createdAt: -1 }` compound index |
| `dto/entity.dto.ts` | Create/Update/ListQuery/Response DTOs per field — every field validated + `@ApiProperty`; ListQuery extends `PaginationQueryDto` |
| `entity.contracts.ts` | Real enums (or delete if none) |
| `entity.repository.service.ts` | Extra query helpers only if needed; keep `deleteByOrganizationId` |
| `entity.service.ts` | Real filter building in `findMany`, real `toResponse` mapping |
| `entity.controller.ts` | Apply the chosen guard decorators per endpoint; adjust routes |
| `entity.module.ts` | Import other feature modules if the service needs them (`forwardRef` for cycles) |

Register the module in `AppModule` imports.

## 2. After generating

1. Run lint + `tsc --noEmit` (or `bun run build`); fix imports.
2. Boot the app and check `/docs` — the new endpoints must appear with complete schemas.
3. Remind the user: cascade deletion — wire `deleteByOrganizationId` into the org-deletion listener if the project has one; add `__test__/*.spec.ts` for non-trivial service logic.
