export const EMPTY_OBJ: { readonly [key: string]: any } = __DEV__ ? Object.freeze({}) : {};

export const NOOP = (): void => {};

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  hasOwnProperty.call(val, key);

export const isArray = Array.isArray;
export const isFunction = (val: unknown): val is Function => typeof val === 'function';

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string => objectToString.call(value);

export function toRawType(value: unknown): string {
  return toTypeString(value).slice(8, -1);
}

// compare whether a value has changed, accounting for NaN.
export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue);

function cacheStringFunction<T extends (str: string) => string>(fn: T): T {
  const cache: Record<string, string> = Object.create(null);
  return ((str: string) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }) as any;
}

export const capitalize = cacheStringFunction((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
