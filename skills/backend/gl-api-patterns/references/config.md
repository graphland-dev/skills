# Config — modular @nestjs/config + Joi env validation at boot

## Why this pattern

Misconfigured deploys fail **at boot** with a precise message, not at first request. Config access is namespaced (`configService.get('app.port')`) instead of `process.env` scattered through the code.

## Structure

```
src/config/
├── env.validation.ts        Joi schema — the single source of truth for env vars
├── config__app.config.ts    () => ({ app: { port, nodeEnv } })
├── config__database.config.ts
├── config__cors.config.ts
├── config__<concern>.config.ts   one small factory per concern
└── index.ts                 exports the loaders array + schema
```

Wire-up in `AppModule`:

```ts
ConfigModule.forRoot({
  isGlobal: true,
  load: configLoaders,                 // all the config__* factories
  validationSchema: envValidationSchema,
})
```

`templates/common/config.ts` shows the factory pattern (collapsed into one file); `templates/common/env.validation.ts` is the trimmed starter schema.

## Joi schema conventions

- `required()` for anything the app cannot run without (`MONGODB_URI`, `BETTER_AUTH_SECRET`).
- Pattern-validate connection strings (`/^mongodb(\+srv)?:\/\//`, `/^rediss?:\/\//`) with a custom `messages` hint.
- Defaults in the schema (`PORT` → 3000, `NODE_ENV` → development), not in reading code.
- Paired optionals validated together: if `GITHUB_CLIENT_ID` is set, `GITHUB_CLIENT_SECRET` must be too (Joi `.and()` or custom rule) — half-configured OAuth should fail boot.
- Booleans travel as `'true' | 'false'` strings (`Joi.string().valid('true','false')`) and are parsed in the config factory.

## .env conventions

- `apps/api/.env` is gitignored; `apps/api/.env.example` is committed and lists **every** variable in the Joi schema with safe placeholder values, grouped by concern with comments.
- Frontend env stays separate (`apps/console/.env` → `VITE_API_URL=http://localhost:4001`).
- Never read `process.env` outside `src/config/` — add a factory instead.
