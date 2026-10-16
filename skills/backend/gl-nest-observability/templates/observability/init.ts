import { initSentry } from "./drivers/sentry/init";
import type { ObservabilityOptions } from "./observability.types";

/**
 * Starts the telemetry vendor. Call from the app's `instrument.ts`, imported
 * first in `main.ts`: the vendor patches http, graphql, mongoose and Nest on
 * load. Keep this file free of Nest imports for the same reason.
 */
export function initObservability(options: ObservabilityOptions) {
  initSentry(options);
}
