# Infra notes — queues, mail, logging, docs

Short reference for the standard infra pieces. Adopt each only when the project needs it; none are part of the core CRUD scaffold.

## Queues — BullMQ + Bull Board

- `@nestjs/bullmq` + Redis (`REDIS_URL`). One queue per concern (e.g. `campaign`), processors in `src/common/queue/`.
- Batch work pattern: controller enqueues, processor consumes with retries/backoff; never do bulk sends inline in a request handler.
- **Bull Board** UI mounted at `/admin/queues` (guarded) for inspecting/retrying jobs.
- Redis runs via the workspace `docker-compose.yml` in dev.

## Mail — Nodemailer + MJML

- SMTP config behind a `MailModule` (`src/common/mail/`); env-driven and fully optional — Joi enforces that when `MAIL_HOST` is set, the credential pair is too.
- Templates authored in MJML, compiled to HTML; one function per email type (invitation, reset, …).

## Logging & observability

- Default: Nest's built-in logger is fine to start.
- Scale-up path: Winston/Pino structured logs + optional OpenTelemetry (HyperDX) — initialized in `main.ts` before `NestFactory.create`, flushed on shutdown. Env-gated (`HYPERDX_API_KEY` optional), so dev runs clean without it. See `setup-workspace/templates/api/src/main.ts` for the bundled baseline.
- Always implement graceful shutdown: handle `SIGINT`/`SIGTERM`, close the Nest app, flush telemetry (see `templates/common/main.ts`).

## API docs — Swagger

- `@nestjs/swagger` served at `/docs`; every endpoint has `@ApiTags` + `@ApiOperation`, every DTO field `@ApiProperty`.
- Register each auth scheme with `addBearerAuth(..., '<scheme-name>')` so "Authorize" works for both session tokens and API keys.
- The OpenAPI JSON doubles as the contract for frontend types and external SDKs.

## Testing

- Jest + `@nestjs/testing`; unit specs co-located in `__test__/` folders next to the code; e2e via supertest. Pure logic (e.g. template utils) gets plain unit tests without the Nest harness.
