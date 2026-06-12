# Data layer — gqlClient + co-located `~util.ts` (optional module)

This module is for GraphQL backends following GraphLand's API conventions. For REST projects, skip the client and keep only the co-location + query-key conventions (see Adaptation).

## The client (`templates/lib/gql-client.ts`)

A ~150-line fetch-based GraphQL client — no Apollo, no `graphql` package, no codegen requirement:

```ts
export const gql = String.raw;  // tagged template → syntax highlighting, zero runtime
export const gqlClient = new GraphQLClient(`${import.meta.env.VITE_BACKEND_BASE_URL}/graphql`);

await gqlClient.request<{ ns__entities: EntitiesWithPagination }>(QUERY, { where: params });
gqlClient.setHeader("x-tenant", tenant);   // runtime headers (multi-tenant apps)
```

- Auth: reads a JWT from `templates/lib/token-service.ts` (localStorage) and attaches `Authorization: Bearer <token>` per request.
- Errors: GraphQL errors are flattened into a thrown `Error` whose message joins all error messages — so TanStack Query's `error` is always a plain `Error`.
- Display errors with `getMutationErrorMessage(mutation, fallback?)` → string | null, fed straight into `FormErrorAlert`.

## Co-located `~util.ts`

Each route folder owns its operations + form schema in a `~util.ts` (the `~` prefix keeps it out of file-based routing):

```ts
export const ENTITY_LIST_QUERY = gql`...`;      // list: (where: CommonPaginationDto) → { meta, nodes }
export const CREATE_ENTITY_MUTATION = gql`...`; // (body: CreateEntityInput) → { _id }
export const UPDATE_ENTITY_MUTATION = gql`...`; // (where: CommonFindDocumentDto, body) → boolean
export const DELETE_ENTITY_MUTATION = gql`...`; // (where: CommonFindDocumentDto) → boolean
export const entityFormSchema = z.object({ ... });
export type EntityFormValues = z.infer<typeof entityFormSchema>;
```

Naming: operations are `namespace__operationName` (double underscore). Single-document targeting uses `where: { key: "_id", operator: MatchOperator.Eq, value: id }`. Full example: `templates/example-module/~util.ts`; scaffold with the `gl-console-graphql-util` skill.

## TanStack Query conventions

```ts
const entitiesQuery = useQuery({
  queryKey: ["entities", paginationParams],          // [resource, ...params]
  queryFn: () => gqlClient.request<...>(ENTITY_LIST_QUERY, { where: paginationParams }),
});

const createMutation = useMutation({
  mutationFn: (input) => gqlClient.request(CREATE_ENTITY_MUTATION, { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entities"] }), // prefix invalidation
});
```

- Query keys start with the resource name; add scoping segments (e.g. tenant) before params in multi-tenant apps: `["entities", tenant, params]`.
- After any mutation, invalidate by resource prefix — every page/pageSize/sort variant refetches.
- `paginationParams` comes from `buildPaginationParams` ([data-table.md](data-table.md)), so the URL drives the query key and refetching is automatic on navigation.

## Adaptation

- **REST**: drop `gql-client.ts`; keep `~util.ts` co-location with typed fetch functions (`listEntities(params)`, `createEntity(body)`), the same Zod schema exports, the same query-key and prefix-invalidation conventions, and `getErrorMessage` for display.
- **GraphQL codegen**: keep the client; import generated types for nodes/inputs instead of hand-written interfaces, and re-point `table-utils.ts` enums at generated ones.
- **Next.js**: the client is isomorphic except `token-service` (localStorage) — for server components, read the token from cookies and pass headers per request, or fetch in route handlers.
- **Different auth**: replace `token-service.ts` (it's 40 lines) or set headers via the constructor config.
