import * as Sentry from "@sentry/nestjs";
import type { ObservabilityOptions } from "../../observability.types";

export function initSentry(options: ObservabilityOptions) {
  const header = options.forceTraceHeader?.toLowerCase();

  Sentry.init({
    dsn: options.dsn,
    enabled: options.enabled,
    environment: options.environment,
    tracesSampler: ({ normalizedRequest, inheritOrSampleWith }) =>
      header && normalizedRequest?.headers?.[header] === "1"
        ? 1
        : inheritOrSampleWith(options.traceSampleRate),
    ignoreTransactions: options.ignoreTraces,
    enableLogs: options.logs ?? true,
    integrations:
      (options.runtimeMetrics ?? true)
        ? [Sentry.nodeRuntimeMetricsIntegration()]
        : [],
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof Error && options.ignoreError?.(error)) return null;
      return event;
    },
  });
}
