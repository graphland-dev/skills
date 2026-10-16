---
name: gl-nest-observability
description: >-
  How to add and use observability in NestJS backends through a vendor-neutral
  layer (Sentry is the bundled driver): error capture, logs from Nest's Logger,
  per-service tracing of every provider method (Nest Observe–style), sampling
  with a debug header, runtime metrics, noise filters, swapping vendors, and
  reading traces to find slow requests and N+1 queries. Ships the full layer
  as copyable templates. Use when wiring telemetry into a Nest app, adding logs
  or tracing, debugging a slow GraphQL/REST request, asking "why is this trace
  missing / noisy / N+1", replacing @nestjs/observe or another APM, or moving
  off Sentry. Invoke as /gl-nest-observability.
---

# NestJS observability (`/gl-nest-observability`)

One vendor for errors, logs, traces and runtime metrics, currently **Sentry**, behind a **vendor-neutral layer**. App code never imports `@sentry/*`.

## Templates (copy these)

| Path | Copy to |
| --- | --- |
| [templates/observability/](templates/observability/) | A shared backend package (monorepo), or `src/observability/` in a single-app repo |
| [templates/app/instrument.ts](templates/app/instrument.ts) | `src/instrument.ts` of each app. Fix the import path, DSN, header name and ignored error class |
| [templates/app/main.ts](templates/app/main.ts) | Merge into the app's `main.ts` and root module |

Then install the vendor SDK where the folder lives (`@sentry/nestjs`) and follow *Wiring an app*. The templates are complete, runnable source. Don't rewrite them from memory.

## Layer map

```
observability/
├── init.ts                    initObservability(options): vendor start, no Nest imports
├── index.ts                   public API (below)
├── observability.types.ts     ObservabilityOptions, Telemetry, TelemetryDriver
├── telemetry.ts               picks the driver; exports `telemetry`
├── observability.module.ts    ObservabilityModule.forRoot(): request instrumentation + global error filter
├── app-logger.ts              AppLogger: ConsoleLogger that also ships logs
├── trace-providers.ts         traceProviders(app): span per provider method
├── traced.decorator.ts        @Traced(): opt in skipped methods
├── wrap-in-span.ts            shared wrapper (copies decorator metadata)
└── drivers/sentry/            ONLY place that imports @sentry/*
    ├── init.ts                options → Sentry.init
    └── driver.ts              TelemetryDriver for Sentry
```

| Signal | Mechanism |
| --- | --- |
| Errors | `ObservabilityModule.forRoot()` (vendor global filter); `ignoreError` drops expected domain errors |
| Logs | `AppLogger` → `telemetry.log` (info and above) |
| Traces: framework | Vendor auto-instrumentation: HTTP, GraphQL, Mongo/Mongoose, Redis, outbound HTTP, guards, pipes, interceptors, filters, BullMQ, `@OnEvent`, schedules |
| Traces: our code | `traceProviders(app)` + `@Traced()` |
| Runtime | `runtimeMetrics: true` (CPU, RSS, heap, event-loop delay, uptime) |

## Wiring an app

```
- [ ] 1. src/instrument.ts calls initObservability({...}) from "<observability>/init"
- [ ] 2. `import "./instrument"` is the FIRST line of main.ts
- [ ] 3. ObservabilityModule.forRoot() is the first import of the root module
- [ ] 4. NestFactory.create(..., { logger: new AppLogger() })
- [ ] 5. traceProviders(app) right after NestFactory.create
- [ ] 6. Optional client debug header: send x-app-trace: 1 when a local flag is set
- [ ] 7. Verify with a dummy-DSN script (the vendor is off in dev)
```

Code for every step, the driver contract, and how to add a vendor: [references/setup.md](references/setup.md).

## Non-negotiables

1. **No `@sentry/*` (or any vendor SDK) outside `drivers/<vendor>/`.** If app code needs something new, add it to `Telemetry` / `TelemetryDriver` and implement it in the driver.
2. **The init entry stays Nest-free.** `observability/init.ts` and `drivers/*/init.ts` must not import `@nestjs/*`, the barrel `index.ts`, or the driver runtime. The vendor patches modules on load, and a Nest import before init silently loses spans.
3. **Production only:** `enabled: process.env.NODE_ENV === "production"`.
4. **Sampling is `traceSampleRate` + `forceTraceHeader`.** The Sentry driver maps these to `tracesSampler` with `inheritOrSampleWith`, so upstream decisions are kept.
5. **Drop expected errors** (domain exceptions, validation, not-found) with `ignoreError`. Compare by `constructor.name` in `instrument.ts`, because importing the class would load Nest before init.
6. **Never log secrets or PII:** tokens, passwords, OTPs, credential headers, emails, phones, raw IPs, full GraphQL variables, payment payloads.
7. **Name every GraphQL operation** on the client. Unnamed ones collapse into `POST /graphql`.
8. **CommonJS build assumed.** `traceProviders` finds app classes through `require.cache` (Nest's default `tsc` output). For ESM, build the class set from `ModulesContainer` instead.

## Gotchas (learned the hard way)

| Symptom | Cause | Fix |
| --- | --- | --- |
| `this.logger.log` never reaches the vendor | Nest's `ConsoleLogger` writes to `process.stdout`; console-patching integrations only see `console.*` | `AppLogger` passed to `NestFactory.create` |
| Logs flooded on every boot | Nest startup contexts (`InstanceLoader`, `RoutesResolver`, …) | Skipped in `AppLogger` |
| Traces full of `redis-bzpopmin` / `redis-evalsha` | BullMQ workers poll Redis outside any request | `ignoreTraces: [/^redis-/]` (in-request Redis spans are kept) |
| Resolver / `@OnEvent` / `@Processor` breaks after wrapping | Nest reads decorator metadata off the function | `traceProviders` skips decorated methods; `@Traced()` copies metadata onto the wrapper |
| Double spans on guards/pipes | The vendor's Nest integration already wraps them | Skipped by name plus `driver.isInstrumented(fn)` |
| Spans from mongoose/ioredis classes | Wrapping library providers | Only classes from modules outside `node_modules` are wrapped |
| Orphan spans from crons/boot | Wrapped methods called outside a request | `onlyIfParent: true` |
| "Traces aren't real time" | 90% of requests are not sampled | Debug header, or wait ~1 min |
| Local sampler test shows 0% | The test client shares one propagation context | `Sentry.startNewTrace()` per simulated request |
| Quota burns fast | A traced method in a loop: N items = N spans | Batch the work, skip the method, or lower the rate |
| Rate-limit / 429 from another telemetry SDK | Two APMs (for example `@nestjs/observe`) shipping the same data | Remove the other SDK |

## Reading a trace

Short version. Full guide with search queries: [references/reading-traces.md](references/reading-traces.md).

- **The widest bar is where the time went.** Expand it.
- **N+1** is a staircase of the *same* `db` span repeated one after another.
- **A batched loader is not N+1:** many identical function spans that start and end together, with **one** `db` child, are callers waiting on a single batched query (for example a file loader called 23 times → one `find files`). Count `db` spans, not function spans.
- **Repeated `ValidationPipe`** means one per resolver parameter, plus one per field-resolver call. Normal and cheap.
- **Gaps** are untraced time: CPU work, an unpatched client, or an outside API.

## When the user asks to…

| Request | Do |
| --- | --- |
| "Add observability to app X" | Copy the templates, follow *Wiring an app*. Only `instrument.ts` is app-specific |
| "Trace this one method" that is skipped | `@Traced()` from the observability folder |
| "Report this handled error" | `telemetry.captureException(error, { ...ids })` |
| "Hide a noisy span" | Add to `SKIPPED_METHODS`, or an exact `Class.method` skip set in `trace-providers.ts` |
| "Move off Sentry" / "add Datadog/OTel" | New `drivers/<vendor>/`, repoint `init.ts` + `telemetry.ts`; see [references/setup.md](references/setup.md#5-adding-a-vendor) |
| "Why is this request slow?" | Fetch the trace (Sentry MCP `get_sentry_resource`, type `trace`) and apply *Reading a trace* |
| "Is the server healthy?" | Runtime metrics; host CPU and disk are outside the vendor |
| "Log X" | `private readonly logger = new Logger(Service.name)`; ids and outcomes only, never PII |

## Related

- `gl-api-patterns`: NestJS module, DTO and error conventions this layer plugs into
