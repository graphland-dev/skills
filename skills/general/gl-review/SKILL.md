---
name: gl-review
description: Review a PR, branch, or working-tree diff against the GraphLand guidelines — backend (DTO validation, pagination contract, org/tenant scoping, module anatomy) and console (URL-synced tables, ~util.ts conventions, form/sheet patterns, TanStack Query usage). Use before merging changes to a GraphLand project.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-invocation: "manual"  # run on explicit request, not auto-triggered
  graphland-input: "[PR number | branch | git range]"
---

> **Locating sibling skills:** paths like `gl-console-patterns/...` or `gl-api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Review a diff for conformance with the GraphLand guidelines. The target (a PR number, branch, or git range) comes from the user's request; if none is given, default to the working tree plus the current branch vs. the default branch.

## 0. Preconditions and questions

- Resolve the diff: a number → `gh pr diff <n>`; a branch or range → `git diff <target>`; empty → working tree plus current branch vs the default branch. Ask only when ambiguous.
- Detect the project facts that change the rules — auth (`better-auth` vs `custom-jwt`), tenancy (multi vs single), data layer (REST/GraphQL) — from the root README, package.json deps, or `src/authorization/`.
- Load only the references the diff touches:

| Diff touches | Read |
| --- | --- |
| API controllers / DTOs | `gl-api-patterns/references/validation.md`, `module-structure.md` |
| list endpoints / pagination | `gl-api-patterns/references/pagination.md` |
| guards / decorators / auth | `gl-api-patterns/references/auth.md` |
| config / env | `gl-api-patterns/references/config.md` |
| console list pages / tables | `gl-console-patterns/references/data-table.md` |
| forms / sheets | `gl-console-patterns/references/forms.md`, `sheets.md` |
| `~util.ts` / queries | `gl-console-patterns/references/data-layer.md` |

## 1. What to check

**API:**

- Every DTO field validated (class-validator) + `@ApiProperty`; list queries extend `PaginationQueryDto`.
- Tenancy scoping on **every** query: `@OrganizationId()` (Better Auth) or `@TenantName()` + tenant filter (custom-jwt multi-tenant); `userId` / `systemRoles` scoping when single-tenant. A missing scope filter is always a blocker.
- Controller → service → repository layering; no Mongoose model access from controllers.
- Errors flow through the `HttpExceptionFilter` conventions; env read via modular config + Joi, never raw `process.env` in feature code.

**Console:**

- List pages: pagination/sort/search synced to URL params, not `useState` (panels/sheets are the exception — local state is correct there).
- Data ops co-located in `~util.ts` (`_util.ts` on Next.js); GraphQL operations named `namespace__operation`; TanStack Query keys `[resource, ...params]` (plus tenant segment when multi-tenant) with prefix invalidation after mutations.
- Forms: React Hook Form + Zod via the `FormField*` catalog; `z.coerce.number()` for numeric inputs, `.trim().min(1, ...)` for required strings.
- No raw `fetch` in components; no React Router in Vite apps.

**Both:** pagination meta shape matches the `DataTable` contract (`totalCount`, `totalPages`, ...).

## 2. Report

- Findings as `file:line — issue`, each citing the guideline it deviates from, grouped by severity: **Blocker** (cross-tenant data leaks, unvalidated input, broken pagination contract) · **Should fix** (pattern deviations) · **Nit**.
- Report only deviations verified against the reference — when the guideline allows an adaptation (`gl-console-patterns/references/adaptation.md`), check it before flagging.
- End with a one-line verdict. Do not rewrite code unless the user asks.
