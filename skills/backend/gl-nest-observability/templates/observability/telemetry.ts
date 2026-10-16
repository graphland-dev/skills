import { sentryDriver } from "./drivers/sentry/driver";
import type { Telemetry, TelemetryDriver } from "./observability.types";

export const driver: TelemetryDriver = sentryDriver;

/** Vendor-neutral telemetry for application code. */
export const telemetry: Telemetry = driver;
