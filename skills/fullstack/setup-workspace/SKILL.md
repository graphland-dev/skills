---
name: setup-workspace
description: Bootstrap a GraphLand fullstack monorepo — bun workspaces with a NestJS API (apps/api), a React console (apps/console), mprocs for parallel dev, and docker-compose for MongoDB/Redis. Use once when starting a new fullstack project.
argument-hint: <project-name>
disable-model-invocation: true
---

Bootstrap a fullstack monorepo following the GraphLand reference architecture (waland). Project name from arguments: **$ARGUMENTS**

## 1. Workspace root

Create the project folder, `git init`, then copy from `${CLAUDE_PLUGIN_ROOT}/skills/fullstack/setup-workspace/templates/`:

| Template | Target | Notes |
| --- | --- | --- |
| `package.json` | `./package.json` | Set `name` to `<project-name>-monorepo`; workspaces are `apps/*` + `packages/*` |
| `mprocs.yaml` | `./mprocs.yaml` | One proc per app; `bun dev` at root runs them all in a tabbed UI |
| `docker-compose.yml` | `./docker-compose.yml` | MongoDB 8 + Redis 7 with healthchecks for local dev |

Add a root `.gitignore` (node_modules, dist, .env, data/) and a short root `README.md` (quick start: `docker compose up -d`, `bun install`, `bun dev`; workspace table).

## 2. apps/api — NestJS backend

1. `bunx @nestjs/cli new api` into `apps/` (skip git, choose npm then delete its lockfile — bun workspaces install from the root).
2. Install: `@nestjs/mongoose mongoose @nestjs/config @nestjs/swagger joi class-validator class-transformer` (+ `tsc-alias` as devDep).
3. Configure the `@/` → `src/` path alias (tsconfig `paths`; build script `nest build && tsc-alias`).
4. Apply the API foundation from `${CLAUDE_PLUGIN_ROOT}/skills/backend/api-patterns/templates/common/`: `pagination.dto.ts` → `src/common/common-models/`, `http-exception.filter.ts` → `src/common/filters/`, `organization-id.decorator.ts` → `src/common/decorators/`, `env.validation.ts` + `config.ts` factories → `src/config/`, and the `main.ts` bootstrap (ValidationPipe + filter + CORS + Swagger).
5. Wire `ConfigModule.forRoot({ isGlobal: true, load: configLoaders, validationSchema: envValidationSchema })` and `MongooseModule.forRootAsync` (reading `database.mongodbUri`) in `AppModule`.
6. Create `apps/api/.env.example` covering every variable in the Joi schema; copy to `.env` with local values (`MONGODB_URI=mongodb://localhost:27017/<project>`, port 4001).
7. Auth: set up Better Auth per `${CLAUDE_PLUGIN_ROOT}/skills/backend/api-patterns/references/auth.md` (or defer and note it as a TODO if the user wants to start without auth).

## 3. apps/console — React frontend

Scaffold a Vite + React + TS app in `apps/console`, then run `/graphland:setup-foundation` inside it (shadcn + ReUI DataGrid + GraphLand foundation components, providers). Set `apps/console/.env` → `VITE_API_URL=http://localhost:4001`. Dev runs on port 5173 — add it to the API's `TRUSTED_ORIGINS`/CORS env.

## 4. Verify

1. `docker compose up -d` — mongo + redis healthy.
2. `bun install` at the root (single lockfile).
3. `bun dev` — mprocs shows api + console tabs; API on 4001 with Swagger at `/docs`, console on 5173.
4. Scaffold the first feature: `/graphland:new-api-module <Entity>` in the API, `/graphland:new-module <route> <Entity>` in the console.
