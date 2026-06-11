# Feature module structure

## Why this pattern

One feature = one folder under `src/api/<feature>/` with a fixed file anatomy. Anyone can open any module and know exactly where endpoints, logic, data access, validation, and schema live. Layers stay strict: **controller → service → repository** — the controller never touches Mongoose, the repository never throws HTTP exceptions, the service is the only place with business rules.

## Anatomy

```
src/api/entity/
├── entity.controller.ts          HTTP endpoints; guards + DTOs only, no logic
├── entity.service.ts             Business logic; org-scoping, NotFoundException, response mapping
├── entity.repository.service.ts  Data layer; the only file that touches the Mongoose model
├── entity.module.ts              @Module wiring (MongooseModule.forFeature, providers, exports)
├── entity.contracts.ts           Enums/constants for the feature (e.g. EntityStatus)
├── dto/
│   └── entity.dto.ts             Create/Update/ListQuery/Response DTOs (class-validator + @ApiProperty)
├── entities/
│   └── entity.entity.ts          Mongoose @Schema + HydratedDocument type + indexes
├── events/                       (optional) event payload classes, e.g. EntityCreatedEvent
├── listeners/                    (optional) @OnEvent handlers (EventEmitter2)
└── __test__/
    └── *.spec.ts                 Jest unit tests, co-located
```

Full working example: `templates/example-module/`. Register each feature module in `AppModule` imports.

## Naming conventions

- Files: `<feature>.<role>.ts` — `controller`, `service`, `repository.service`, `module`, `contracts`.
- Classes: `EntityController`, `EntityService`, `EntityRepositoryService`, `EntityModule`.
- Routes: versioned plural — `@Controller('v1/entities')`.
- DTOs: `CreateEntityDto`, `UpdateEntityDto`, `EntityListQueryDto` (extends `PaginationQueryDto`), `EntityResponseDto`, `PaginatedEntitiesResponseDto`.
- Mongo collections: snake_case plural (`@Schema({ collection: 'entities' })`).
- Path alias: `@/` → `src/` (tsconfig `paths` + `tsc-alias` in the build script); cross-module imports use `@/api/...`/`@/common/...`, intra-module imports stay relative.

## Layer rules

- **Controller**: declares the route, guard, Swagger metadata (`@ApiTags`, `@ApiOperation`), and delegates. One-liner bodies.
- **Service**: takes `organizationId` as an explicit parameter on every public method (never from the body). Maps documents to `ResponseDto`s (`toResponse private method`) so Mongoose internals don't leak. Throws `NotFoundException`/`ConflictException` etc.
- **Repository**: thin Mongoose wrapper (`create`, `findManyPaginated`, `findOne`, `updateOne`, `deleteOne`, plus cascade helpers like `deleteByOrganizationId`). Takes `FilterQuery` from the service; no HTTP concepts.
- **Cross-module dependencies**: import the other module and inject its exported service; use `forwardRef(() => OtherModule)` for cycles.

## Events and listeners (async side-effects)

For fire-and-forget side-effects (audit logging, counters, notifications) use NestJS `EventEmitter2`: define a payload class in `events/`, `eventEmitter.emit('entity.created', new EntityCreatedEvent(...))` from the service, and handle it in `listeners/` with `@OnEvent('entity.created')`. Keeps the request path fast and the side-effect isolated/testable.

## Advanced: hook-based repository base class

For projects with many CRUD modules, waland defines an abstract `PersistenceRepositoryService<T>` (permission/before/after hooks per operation, pagination, populations, key mapping) that feature repositories extend. Adopt it once a project crosses ~5 similar CRUD modules; start with the plain repository in `templates/example-module/` until then.
