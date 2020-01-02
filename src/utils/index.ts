export const EMPTY_OBJ: { readonly [key: string]: any } = __DEV__ ? Object.freeze({}) : {};

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  hasOwnProperty.call(val, key);

export const isArray = Array.isArray;

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string => objectToString.call(value);

export function toRawType(value: unknown): string {
  return toTypeString(value).slice(8, -1);
}
