import { ConsoleLogger } from "@nestjs/common";
import type { LogLevel } from "./observability.types";
import { telemetry } from "./telemetry";

// Nest framework startup chatter; every boot would otherwise flood the log store.
const SKIPPED_CONTEXTS = new Set([
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
  "NestFactory",
  "NestApplication",
  "GraphQLModule",
]);

/**
 * Prints like Nest's ConsoleLogger and ships info and above to the telemetry
 * vendor. Needed because ConsoleLogger writes to process.stdout directly,
 * which console-patching integrations never see.
 */
export class AppLogger extends ConsoleLogger {
  log(message: unknown, ...params: unknown[]) {
    super.log(message, ...params);
    this.forward("info", message, params);
  }

  warn(message: unknown, ...params: unknown[]) {
    super.warn(message, ...params);
    this.forward("warn", message, params);
  }

  error(message: unknown, ...params: unknown[]) {
    super.error(message, ...params);
    this.forward("error", message, params);
  }

  fatal(message: unknown, ...params: unknown[]) {
    super.fatal(message, ...params);
    this.forward("fatal", message, params);
  }

  private forward(level: LogLevel, message: unknown, params: unknown[]) {
    const last = params.at(-1);
    const context = typeof last === "string" ? last : this.context;
    if (context && SKIPPED_CONTEXTS.has(context)) return;

    const stack =
      params.length > 1 && typeof params[0] === "string" ? params[0] : undefined;
    telemetry.log(level, toText(message), {
      ...(context && { context }),
      ...(stack && { stack }),
    });
  }
}

function toText(message: unknown) {
  if (typeof message === "string") return message;
  if (message instanceof Error) return message.message;
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}
