// Point this at wherever the observability folder lives in the target repo.
import { initObservability } from "../observability/init";

initObservability({
  dsn: "<vendor DSN>",
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  traceSampleRate: 0.1,
  // Requests with this header set to "1" are always traced.
  forceTraceHeader: "x-app-trace",
  // BullMQ workers poll Redis every few seconds outside any request.
  ignoreTraces: [/^redis-/],
  // Expected domain errors for the API client — not production incidents.
  ignoreError: (error) => error.constructor.name === "AppException",
});
