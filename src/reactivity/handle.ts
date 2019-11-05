import { isObject, hasOwn } from '../utils';
import { OperationTypes, track, trigger } from './run';
import { createTriggerProxy, createTrackProxy, createReadonlyProxy, toRaw } from './proxy';

function createGetter(shouldTrack: boolean, shouldTrigger: boolean) {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver);
    const isObj = isObject(res);
    if (shouldTrigger) {
      return isObj ? createTriggerProxy(res) : res;
    }
    if (shouldTrack) {
      track(target, OperationTypes.GET, key);
      return isObj ? createTrackProxy(res) : res;
    }
    return isObj ? createReadonlyProxy(res) : res;
  };
}

export const triggerProxyHandles: ProxyHandler<object> = {
  get: createGetter(false, true),
  set: (target: object, key: string | symbol, value: unknown, receiver: object): boolean => {
    const rawValue = toRaw(value);

    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, rawValue, receiver);

    if (target === toRaw(receiver)) {
      if (hadKey) {
        trigger(target, OperationTypes.SET, key);
      } else {
        trigger(target, OperationTypes.ADD, key);
      }
    }
    return result;
  },
  deleteProperty: (target: object, key: string | symbol): boolean => {
    const hadKey = hasOwn(target, key);
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, OperationTypes.DELETE, key);
    }
    return result;
  },
};

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  track(target, OperationTypes.HAS, key);
  return result;
}

function ownKeys(target: object): (string | number | symbol)[] {
  track(target, OperationTypes.ITERATE);
  return Reflect.ownKeys(target);
}

function lockSetter(
  _target: object,
  key: string | symbol,
  _value: unknown,
  _receiver: object,
): boolean {
  throw new Error(`Cannot set key: ${String(key)} of hux state except in reducer.`);
}

function lockDeleteProperty(_target: object, key: string | symbol): boolean {
  throw new Error(`Cannot deleteProperty: ${String(key)} of hux state except in reducer.`);
}

export const trackProxyHandles: ProxyHandler<object> = {
  get: createGetter(true, false),
  set: lockSetter,
  deleteProperty: lockDeleteProperty,
  has,
  ownKeys,
};

export const readonlyHandles: ProxyHandler<object> = {
  get: createGetter(false, false),
  set: lockSetter,
  deleteProperty: lockDeleteProperty,
};
