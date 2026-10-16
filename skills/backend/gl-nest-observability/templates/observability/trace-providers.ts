import { sep } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import { driver } from "./telemetry";
import { isTraced, wrapInSpan } from "./wrap-in-span";

// Lifecycle hooks run outside requests; the rest are already spanned by the vendor's Nest integration.
const SKIPPED_METHODS = new Set([
  "constructor",
  "onModuleInit",
  "onApplicationBootstrap",
  "onModuleDestroy",
  "beforeApplicationShutdown",
  "onApplicationShutdown",
  "canActivate",
  "transform",
  "intercept",
  "catch",
  "use",
]);

/**
 * Wraps every method of our own providers (services, repositories, adapters)
 * in a span, so a trace shows which calls a request spent its time in.
 *
 * Decorated methods are left alone: Nest reads resolver, event and queue
 * metadata off the original function, and the vendor already traces those
 * entry points. Use `@Traced()` to opt one in.
 */
export function traceProviders(app: INestApplication) {
  if (!driver.isEnabled()) return;

  const appClasses = collectAppClasses();
  for (const moduleRef of app.get(ModulesContainer).values()) {
    for (const wrapper of moduleRef.providers.values()) {
      const instance: unknown = wrapper.instance;
      if (!instance || typeof instance !== "object") continue;

      let proto = Object.getPrototypeOf(instance);
      while (proto && appClasses.has(proto.constructor)) {
        wrapMethods(proto);
        proto = Object.getPrototypeOf(proto);
      }
    }
  }
}

/** Classes exported from compiled app and workspace code, not from node_modules. */
function collectAppClasses() {
  const classes = new Set<unknown>();
  const nodeModules = `${sep}node_modules${sep}`;
  for (const mod of Object.values(require.cache)) {
    if (!mod || mod.filename.includes(nodeModules)) continue;
    const exported: unknown = mod.exports;
    if (!exported || typeof exported !== "object") continue;
    for (const value of Object.values(exported)) {
      if (typeof value === "function") classes.add(value);
    }
  }
  return classes;
}

function wrapMethods(proto: Record<string | symbol, unknown>) {
  const ownerName = (proto.constructor as { name: string }).name;

  for (const key of Object.getOwnPropertyNames(proto)) {
    if (SKIPPED_METHODS.has(key)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    const original = descriptor?.value;
    if (typeof original !== "function" || !descriptor.writable) continue;
    if (isTraced(original) || driver.isInstrumented(original)) continue;
    if (Reflect.getMetadataKeys(original).length > 0) continue;

    proto[key] = wrapInSpan(original, key, ownerName);
  }
}
