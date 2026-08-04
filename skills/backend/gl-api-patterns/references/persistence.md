# Persistence — PersistenceRepositoryService + query builder

Every feature repository extends the abstract `PersistenceRepositoryService<DOCUMENT_TYPE>` (`templates/common/database/persistence.repository.service.ts`) — this is not an opt-in for large projects, it's the default base class for every `*.repository.service.ts` from the first module. It gives you `create`/`update`/`findOne`/`findAllWithPagination`/`deleteOne` for free; a repository only adds org-scoped finder helpers and, occasionally, raw-model escape hatches.

## Minimal repository

```ts
@Injectable()
export class EntityRepositoryService extends PersistenceRepositoryService<EntityDocument> {
  constructor(
    @InjectModel(Entity.name)
    public readonly entityModel: Model<EntityDocument>,
  ) {
    super(entityModel);
  }

  findByIdForOrganization(id: string, organizationId: string) {
    return this.findOne({
      where: and<Entity>(eq('_id', id), eq('organizationId', organizationId)),
    }) as Promise<EntityDocument | null>;
  }
}
```

`public readonly entityModel` (not `private`) — keep the model accessible so callers can drop to raw Mongoose for the handful of ops the base class doesn't cover (see below).

## Base class methods

| Method | Signature | Notes |
| --- | --- | --- |
| `create` | `create({ data, sessionUser?, executionId? })` | Returns the created document. |
| `findOne` | `findOne({ where, fields?, populations?, sessionUser? })` | Returns `null` if no match — no throw. |
| `findAllWithPagination` | `findAllWithPagination({ where, fields?, populations?, pagination? })` | Returns `AppPaginationResponseDto` — see [pagination.md](pagination.md) for the meta shape and how the service maps it to the API response. `pagination.limit: -1` fetches everything unpaginated. |
| `update` | `update({ where, data, sessionUser?, executionId? })` | **Throws `NotFoundException`** if `where` matches nothing. Returns `{ isUpdated, document }`. |
| `deleteOne` | `deleteOne({ where, sessionUser? })` | Returns `null` if no match — no throw. |

All `where` options take an `IPersistence.Filter` from the query builder, not a raw Mongo filter object.

## Don't wrap the base class

Default to calling `findOne`/`update`/`findAllWithPagination`/`deleteOne` **directly from the service**, with the `where` built inline using `and`/`eq`/... — even for a one-line filter. Do **not** add a repository method whose whole body is "call the inherited method with this filter" just because it's a small addition; that's a wrapper with no logic of its own, and it adds an indirection the reader has to open a second file to see through.

```ts
// service — no repository method needed for this
const document = await this.entityRepository.findOne({
  where: and(eq('_id', id), eq('organizationId', organizationId)),
});
```

Add a repository method only when:
- **The same filter is reused across several call sites** (e.g. `findByIdForOrganization` used by `findOne`, `update`, and `remove` in the service — one place to change the lookup, not three).
- **It needs something the base class genuinely can't express** — raw-model access for atomic ops, aggregation, or bulk writes (see the escape hatch below).

A filter combination used exactly once belongs inline in the service, not as a named repository method.

## Query builder (`persistence-query-builder.ts`)

Build `where` clauses with typed helpers instead of hand-rolled Mongo operators:

```ts
eq(field, value)                    // { field: value }
ne(field, value)                    // { field: { $ne: value } }
inArray(field, values)              // { field: { $in: values } }
ninArray(field, values)             // { field: { $nin: values } }
contains(field, text)               // case-insensitive regex
near(field, coordinates, maxDist)   // $near geo query
dateRange(field, from?, to?)        // { field: { $gte, $lte } }

and(...filters)                     // { $and: [...] }
or(...filters)                      // { $or: [...] }
nor(...filters)                     // { $nor: [...] }
```

Compose them — this is the standard org-scoped-lookup-by-id pattern used everywhere:

```ts
this.findOne({
  where: and<Subscription>(
    eq('_id', id),
    eq('organizationId', organizationId),
  ),
});
```

Or a date-bounded status query for a cron job:

```ts
this.findAllWithPagination({
  where: and<Subscription>(
    eq('status', SubscriptionStatus.ACTIVE),
    dateRange('currentPeriodEnd', undefined, cutoffDate),
  ),
  pagination: { limit: -1 },
});
```

## Escape hatch: raw model access

The base class covers single-document CRUD and one pagination shape — it does **not** wrap atomic updates (`$inc`, `$unset`), multi-document bulk writes, or aggregation pipelines. For those, call the injected model directly (that's why it's `public readonly`, not hidden):

```ts
// atomic counter increment — findOneAndUpdate via the base class can't do $inc safely under concurrency
await this.subscriptionRepository.subscriptionModel.updateOne(
  { _id: subscriptionId, organizationId },
  { $inc: { 'stats.pending': -1, 'stats.sent': 1 } },
);

// aggregation
await this.smsLogModel.aggregate([
  { $match: match },
  { $group: { _id: '$status', count: { $sum: 1 } } },
]);
```

Keep these on the repository, not the service — the service still never imports `mongoose` or touches a `Model` directly.

## Hooks and key mapping (optional, rarely needed)

`super(model, hookConfig)` accepts an optional second argument with `permissionHooks`, `beforeHooks`, `afterHooks` (per `OperationType.CREATE/READ/UPDATE/DELETE`) and a `keyMapper` (rename incoming fields before persisting). These exist for cross-cutting rules that would otherwise be copy-pasted into every service method of a module — e.g. a document-level ownership check that must run on every read. Don't reach for them by default; a plain `if` in the service is usually clearer for a one-off check. Only add a hook when the same rule needs to apply uniformly across `create`/`update`/`findOne`/`findAllWithPagination` for one repository.

## Cascade delete

The base class has no `deleteMany` helper by design (it's a bulk, unscoped-by-id operation). Repositories that need org cascade delete add it explicitly against the raw model:

```ts
deleteByOrganizationId(organizationId: string) {
  return this.entityModel.deleteMany({ organizationId }).exec();
}
```

Wire it into the org-deletion listener — see [auth.md](auth.md).
