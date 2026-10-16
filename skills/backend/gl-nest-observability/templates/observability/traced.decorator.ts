import { wrapInSpan } from "./wrap-in-span";

/** Traces a method that `traceProviders` skips, such as a resolver or event handler. */
export function Traced(): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    descriptor.value = wrapInSpan(
      descriptor.value,
      String(key),
      target.constructor.name,
    );
    return descriptor;
  };
}
