---
name: gl-console-graphql-util
description: Generate a co-located ~util.ts with GraphQL queries, mutations, and Zod form schema for an entity, following the GraphLand UI guideline. Use when adding data operations to an existing module or starting a util file from scratch.
compatibility: Any agent that supports the Agent Skills format (Claude Code, Cursor, opencode, Codex, etc.)
metadata:
  graphland-invocation: "manual"  # run on explicit request, not auto-triggered
  graphland-input: "<EntityName> <namespace>"
---

> **Locating sibling skills:** paths like `gl-console-patterns/...` or `gl-api-patterns/...` refer to other skills from the GraphLand set, installed alongside this one in your agent's skills directory (in the source repo they live under `skills/frontend/`, `skills/backend/`, `skills/fullstack/`).

Generate a `~util.ts` for an entity following the GraphLand data-layer conventions (`gl-console-patterns/references/data-layer.md`).

**Input:** an entity name and namespace (from the user's request; if not given, ask).
**Format:** `<EntityName> <namespace>` — e.g. `Account accounting` · `Product inventory`

## 0. Preconditions and questions

- This skill targets the GraphQL data layer (`gql-client.ts`). For REST projects, write typed fetch functions in `~util.ts` instead, per `gl-console-patterns/references/data-layer.md` → Adaptation.
- Ask the user:
  1. Which **operations** are needed? (list / get-by-id / create / update / delete — default: all)
  2. Any **extra queries** (e.g. related entities for dropdowns)?

## 1. Generate

Start from `gl-console-patterns/templates/example-module/~util.ts`, substituting `Entity`/`entity`/`entities` and `Namespace`/`namespace`. Conventions to preserve:

- Operations named `namespace__operationName` (double underscore).
- List query takes `$where: CommonPaginationDto` and returns `{ meta { currentPage hasNextPage totalCount totalPages } nodes { ... } }`.
- Get-by-id / update / delete take `$where: CommonFindDocumentDto!` (used as `{ key: "_id", operator: Eq, value: id }` at call sites).
- Create returns `{ _id }`; update/delete return a scalar.
- Zod schema named `<entity>FormSchema` with `EntityFormValues = z.infer<...>`; `z.coerce.number()` for numeric inputs, `.trim().min(1, "X is required")` for required strings.
- If the project has GraphQL codegen, import node/input types from generated types instead of hand-written interfaces.

Place the file in the entity's route folder (`~util.ts`; `_util.ts` on Next.js).

## 2. After generating

1. Replace placeholder fields with real backend schema fields.
2. Wire the exports into the route's page (queries via TanStack Query with `[resource, ...params]` keys, prefix invalidation after mutations).
3. If the project uses codegen, regenerate types when new inputs are referenced.
