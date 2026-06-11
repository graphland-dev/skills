---
name: api-patterns
description: GraphLand's NestJS backend guideline — feature-module anatomy (controller/service/repository), class-validator DTOs with a strict global ValidationPipe, page/limit pagination contract, org-scoped multi-tenancy with Better Auth, modular config with Joi env validation, and infra conventions (BullMQ, Swagger, mail). Use when building or reviewing a NestJS API, adding REST endpoints, designing DTOs or Mongoose schemas, implementing pagination or multi-tenant filtering, or starting a new GraphLand backend.
---

# GraphLand API Patterns (NestJS)

The company backend guideline for Better Auth APIs. Canonical stack: **NestJS 11 (REST) + MongoDB/Mongoose + Better Auth (orgs) + class-validator + Swagger**, run with Bun in dev. For the monorepo around it, see the `setup-workspace` skill; for the frontend consuming it, see the `frontend/ui-patterns` skill.

**Copy, don't re-derive**: `templates/example-module/` is a complete generic org-scoped CRUD feature (entity, DTOs, repository, service, controller, module) and `templates/common/` holds the shared pieces (pagination DTOs, exception filter, bootstrap `main.ts`, Joi env schema, config factories, `@OrganizationId()` decorator). Scaffold new features with the `new-api-module` skill.

## Pattern map

| Pattern | Rule of thumb | Reference |
| --- | --- | --- |
| Feature modules | One feature = one folder: `controller / service / repository.service / dto/ / entities/ / contracts / module`; strict layering, `@/` path alias | [references/module-structure.md](references/module-structure.md) |
| Validation | class-validator DTOs + global `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })`; custom constraints for cross-field rules | [references/validation.md](references/validation.md) |
| Pagination | `PaginationQueryDto` (page/limit, max 100) in, `{ data, meta: { page, limit, total, totalPages } }` out — same shape on every list endpoint | [references/pagination.md](references/pagination.md) |
| Auth & tenancy | Better Auth (sessions + orgs) with `@UserSessionGuard` / `@ApiKeyGuard`; every entity carries an indexed `organizationId` and every query filters by it | [references/auth.md](references/auth.md) |
| Config | Modular `@nestjs/config` factories + Joi schema — invalid env fails at boot | [references/config.md](references/config.md) |
| Infra | BullMQ + Bull Board, Nodemailer/MJML, Swagger at `/docs`, graceful shutdown, Jest | [references/infra-notes.md](references/infra-notes.md) |

## Core principles

1. **Strict layers.** Controller (routes/guards/Swagger, one-liner bodies) → Service (business rules, org scoping, `NotFoundException`, DTO mapping) → Repository (the only Mongoose surface). Never skip a layer.
2. **Tenancy is non-negotiable.** `organizationId` comes from the auth guard via `@OrganizationId()` — never from the body — and appears in every repository filter. Wrong org = 404.
3. **Contracts over conventions in handlers.** Everything in/out is a DTO with Swagger metadata; services return `ResponseDto`s, never raw Mongoose documents.
4. **Fail at boot, not at runtime.** Required env is Joi-validated; half-configured optional features (OAuth pairs, SMTP) are boot errors too.
5. **Same pagination shape everywhere** — it feeds the frontend `DataTable` (`totalCount`/`totalPages`) without per-page adapters.
