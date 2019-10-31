import { isObject } from 'util';

export function createProxy<T extends object>(target: T): T;
export function createProxy(target: object) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made proxy: ${String(target)}`);
    }
    return target;
  }

  const observed = new Proxy(target, {
    get: (target: object, key: string | symbol, receiver: object) => {
      const res = Reflect.get(target, key, receiver);

      return isObject(res) ? createProxy(res) : res;
    },

    set: (target: object, key: string | symbol, value: unknown, receiver: object): boolean => {
      const result = Reflect.set(target, key, value, receiver);

      return result;
    },
  });

  return observed;
}
