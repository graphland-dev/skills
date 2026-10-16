# Setup and vendor drivers

Full source is in [../templates/observability/](../templates/observability/). App starters are in [../templates/app/](../templates/app/). This page covers app wiring, the driver contract, and swapping vendors.

## Contents

1. App wiring
2. Options
3. Public API
4. Driver contract
5. Adding a vendor
6. Client debug header
7. Verify locally

## 1. App wiring

`src/instrument.ts`:

```ts
import { initObservability } from "./observability/init";

initObservability({
  dsn: "https://<key>@<org>.ingest.us.sentry.io/<project>",
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  traceSampleRate: 0.1,
  // Requests with this header set to "1" are always traced.
  forceTraceHeader: "x-app-trace",
  // BullMQ workers poll Redis every few seconds outside any request.
  ignoreTraces: [/^redis-/],
  // Expected domain errors for the GraphQL/API client — not production incidents.
  ignoreError: (error) => error.constructor.name === "AppException",
});
```

`src/main.ts`:

```ts
import "./instrument"; // must be the first import

import { NestFactory } from "@nestjs/core";
import { AppLogger, traceProviders } from "./observability";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new AppLogger() });
  traceProviders(app); // providers exist by now; wrap before listen
  // ... pipes, cors, helmet, swagger
  await app.listen(port);
}
```

Root module:

```ts
import { ObservabilityModule } from "./observability";

@Module({
  imports: [ObservabilityModule.forRoot(), /* ...rest */],
})
export class AppModule {}
```

`ObservabilityModule` registers the vendor's global exception filter. If the app adds its own `APP_FILTER`, keep `ObservabilityModule` first so errors are reported before they are rewritten.

## 2. Options

| Option | Default | Meaning |
| --- | --- | --- |
| `dsn` | required | Vendor connection string |
| `enabled` | required | Use `NODE_ENV === "production"` |
| `environment` | — | Tag on every event |
| `traceSampleRate` | required | Fraction traced when nothing upstream decided |
| `forceTraceHeader` | — | Header that forces a trace when `"1"` |
| `ignoreTraces` | — | Root span names never sent (RegExp[]) |
| `ignoreError` | — | `(error) => boolean`; true drops the error |
| `logs` | `true` | Ship Nest logs, info and above |
| `runtimeMetrics` | `true` | CPU, memory, event-loop metrics |

## 3. Public API

From the observability folder's `index.ts`:

| Export | Use |
| --- | --- |
| `ObservabilityModule.forRoot()` | Root module import |
| `AppLogger` | `NestFactory.create(..., { logger: new AppLogger() })` |
| `traceProviders(app)` | Span per method of every app provider |
| `@Traced()` | Opt in a method `traceProviders` skips (resolver, `@OnEvent`, `@Process`) |
| `telemetry.captureException(error, context?)` | Report a handled error |
| `telemetry.startSpan({ name, op }, fn)` | Manual span around a block |
| `telemetry.log(level, message, attributes?)` | Rarely needed; prefer Nest `Logger` |

`initObservability` is only in `observability/init.ts`, so `instrument.ts` never loads Nest.

## 4. Driver contract

`observability.types.ts`:

```ts
interface Telemetry {
  isEnabled(): boolean;
  log(level: LogLevel, message: string, attributes?: Record<string, unknown>): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
  startSpan<T>(options: SpanOptions, fn: () => T): T;
}

interface TelemetryDriver extends Telemetry {
  nestModule(): Omit<DynamicModule, "module">; // vendor Nest wiring
  isInstrumented(fn: Function): boolean;      // vendor already spans this fn
}
```

`startSpan` must:

- return the callback's value as is, so sync stays sync
- end the span when a returned promise settles
- honor `onlyIfParent`

The Sentry driver gets all three from `Sentry.startSpan`.

## 5. Adding a vendor

1. Create `drivers/<vendor>/init.ts` exporting `init<Vendor>(options: ObservabilityOptions)`. Import only the vendor SDK, never `@nestjs/*`.
2. Create `drivers/<vendor>/driver.ts` exporting a `TelemetryDriver`. Map:
   - `nestModule()`: the vendor's Nest module and global filter, or a plain `APP_FILTER` that calls `captureException` and rethrows
   - `log`: the vendor's log API, or an OTLP logs exporter
   - `startSpan`: the vendor tracer. For OpenTelemetry, use `tracer.startActiveSpan` and end the span on promise settle; skip when `onlyIfParent` and `trace.getActiveSpan()` is undefined
   - `isInstrumented`: the vendor's wrap marker, or `() => false`
3. Repoint the import in `observability/init.ts` and `observability/telemetry.ts`.
4. Swap the vendor SDK dependency in the package that holds the observability folder.
5. Map `forceTraceHeader`, `ignoreTraces` and `ignoreError` to the vendor's sampler and filters. These are the options most likely to be silently dropped.

## 6. Client debug header

In the frontend's API client, before sending:

```ts
// Forces a Sentry trace for every request; toggle with localStorage "app:trace" = "1".
if (localStorage.getItem("app:trace") === "1") {
  headers["x-app-trace"] = "1";
}
```

Allow the header in CORS if the API sets `allowedHeaders` explicitly.

## 7. Verify locally

The vendor is off in dev. Run a throwaway script from the app folder (`bun run tmp-check.ts`) and delete it afterwards:

```ts
import { initObservability } from "./observability/init";
initObservability({
  dsn: "https://public@o0.ingest.sentry.io/0",
  enabled: true,
  traceSampleRate: 1,
});

import * as Sentry from "@sentry/nestjs"; // test-only, to observe output
const spans: string[] = [];
Sentry.getClient()?.on("spanEnd", (s) => spans.push(Sentry.spanToJSON(s).description ?? "?"));
Sentry.getClient()?.on("beforeCaptureLog", (log) => console.log(log.level, log.message));

// Build a small Nest app with ObservabilityModule, AppLogger and traceProviders,
// call a service inside Sentry.startSpan({ name: "request" }, ...), then print `spans`.
```

Check that:

- service, repository, and base-class methods appear as `Class.method`
- `@Traced()` handlers produce a span and still fire
- calls outside a request produce no spans
- library providers such as `ConfigService` are not wrapped

To test sampling, wrap each simulated request in `Sentry.startNewTrace(() => ...)`.
