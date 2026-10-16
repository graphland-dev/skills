import { APP_FILTER } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import type { TelemetryDriver } from "../../observability.types";

const SENTRY_WRAPPED = Symbol.for("sentry.nestjs.wrapped");

export const sentryDriver: TelemetryDriver = {
  isEnabled: () => Sentry.isEnabled(),

  log(level, message, attributes) {
    Sentry.logger[level](message, attributes);
  },

  captureException(error, context) {
    Sentry.captureException(error, context && { extra: context });
  },

  startSpan: (options, fn) => Sentry.startSpan(options, fn),

  nestModule: () => ({
    imports: [SentryModule.forRoot()],
    providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
  }),

  isInstrumented: (fn) => Boolean((fn as never)[SENTRY_WRAPPED]),
};
