import { telemetry } from "./telemetry";

const TRACED = Symbol.for("observability.traced");

type Method = (...args: unknown[]) => unknown;

export function isTraced(fn: Function) {
  return Boolean((fn as never)[TRACED]);
}

/**
 * Returns `original` wrapped in a `Class.method` span. The class name is read
 * at call time so inherited methods are named after the concrete subclass.
 * Decorator metadata is copied so Nest still finds handlers on the wrapper.
 */
export function wrapInSpan(original: Method, key: string, ownerName: string) {
  const wrapped = function (this: object | undefined, ...args: unknown[]) {
    const className = this?.constructor?.name ?? ownerName;
    return telemetry.startSpan(
      { name: `${className}.${key}`, op: "function", onlyIfParent: true },
      () => original.apply(this, args),
    );
  };

  for (const metadataKey of Reflect.getMetadataKeys(original)) {
    Reflect.defineMetadata(
      metadataKey,
      Reflect.getMetadata(metadataKey, original),
      wrapped,
    );
  }
  Object.defineProperty(wrapped, "name", { value: original.name });
  Object.defineProperty(wrapped, TRACED, { value: true });
  return wrapped;
}
