export function arrayToMap<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): Map<T[keyof T], T> {
  const result = new Map<T[keyof T], T>();
  for (const item of array) {
    result.set(item[key].toString(), item);
  }
  return result;
}
