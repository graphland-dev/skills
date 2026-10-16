import type { DynamicModule } from "@nestjs/common";

export interface ObservabilityOptions {
  /** Vendor connection string (Sentry DSN, OTLP endpoint, …). */
  dsn: string;
  enabled: boolean;
  environment?: string;
  /** Fraction of requests traced when nothing upstream decided (0–1). */
  traceSampleRate: number;
  /** Request header that forces a trace when its value is "1". */
  forceTraceHeader?: string;
  /** Root span names that are never sent. */
  ignoreTraces?: RegExp[];
  /** Return true for expected errors that should not be reported. */
  ignoreError?: (error: Error) => boolean;
  /** Ship Nest logs (info and above). Defaults to true. */
  logs?: boolean;
  /** Report CPU, memory and event-loop metrics. Defaults to true. */
  runtimeMetrics?: boolean;
}

export type LogLevel = "info" | "warn" | "error" | "fatal";

export interface SpanOptions {
  name: string;
  op?: string;
  /** Skip the span when there is no active trace (boot, crons). */
  onlyIfParent?: boolean;
}

/** What application code may use. Nothing here is vendor-specific. */
export interface Telemetry {
  isEnabled(): boolean;
  log(level: LogLevel, message: string, attributes?: Record<string, unknown>): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
  startSpan<T>(options: SpanOptions, fn: () => T): T;
}

/** Implemented once per vendor under `drivers/`. */
export interface TelemetryDriver extends Telemetry {
  /** Vendor Nest wiring: request instrumentation, global exception reporting. */
  nestModule(): Omit<DynamicModule, "module">;
  /** True when the vendor already wraps this function in a span. */
  isInstrumented(fn: Function): boolean;
}
