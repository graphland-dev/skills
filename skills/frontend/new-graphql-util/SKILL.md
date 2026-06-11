---
name: new-graphql-util
description: Generate a co-located ~util.ts with GraphQL queries, mutations, and Zod form schema for an entity, following the GraphLand UI guideline. Use when adding data operations to an existing module or starting a util file from scratch.
argument-hint: <EntityName> <namespace>
disable-model-invocation: true
---

Generate a `~util.ts` for an entity following the GraphLand data-layer conventions (`${CLAUDE_PLUGIN_ROOT}/skills/frontend/ui-patterns/references/data-layer.md`).

**Arguments:** $ARGUMENTS
**Format:** `<EntityName> <namespace>` — e.g. `Account accounting` · `Product inventory`

Ask the user:

1. Which **operations** are needed? (list / get-by-id / create / update / delete — default: all)
2. Any **extra queries** (e.g. related entities for dropdowns)?

## Generate

Start from `${CLAUDE_PLUGIN_ROOT}/skills/frontend/ui-patterns/templates/example-module/~util.ts`, substituting `Entity`/`entity`/`entities` and `Namespace`/`namespace`. Conventions to preserve:

- Operations named `namespace__operationName` (double underscore).
- List query takes `$where: CommonPaginationDto` and returns `{ meta { currentPage hasNextPage totalCount totalPages } nodes { ... } }`.
- Get-by-id / update / delete take `$where: CommonFindDocumentDto!` (used as `{ key: "_id", operator: Eq, value: id }` at call sites).
- Create returns `{ _id }`; update/delete return a scalar.
- Zod schema named `<entity>FormSchema` with `EntityFormValues = z.infer<...>`; `z.coerce.number()` for numeric inputs, `.trim().min(1, "X is required")` for required strings.
- If the project has GraphQL codegen, import node/input types from generated types instead of hand-written interfaces.

Place the file in the entity's route folder (`~util.ts`; `_util.ts` on Next.js).

## After generating

1. Replace placeholder fields with real backend schema fields.
2. Wire the exports into the route's page (queries via TanStack Query with `[resource, ...params]` keys, prefix invalidation after mutations).
3. If the project uses codegen, regenerate types when new inputs are referenced.
