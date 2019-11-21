import { isObject, hasOwn } from '../utils';
import { OperationTypes, track, trigger } from './run';
import {
  createTriggerProxy,
  createTrackProxy,
  createReadonlyProxy,
  toRaw,
  ReactiveSource,
} from './proxy';

function createGetter(source: ReactiveSource, shouldTrack: boolean, shouldTrigger: boolean) {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver);
    const isObj = isObject(res);
    if (shouldTrigger) {
      return isObj ? createTriggerProxy(source, res) : res;
    }
    if (shouldTrack) {
      track(source, target, OperationTypes.GET, key);
      return isObj ? createTrackProxy(source, res) : res;
    }
    return isObj ? createReadonlyProxy(source, res) : res;
  };
}

function createHas(source: ReactiveSource) {
  return function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key);
    track(source, target, OperationTypes.HAS, key);
    return result;
  };
}

function createOwnKeys(source: ReactiveSource) {
  return function ownKeys(target: object): (string | number | symbol)[] {
    track(source, target, OperationTypes.ITERATE);
    return Reflect.ownKeys(target);
  };
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

export function createTriggerProxyHandles(source: ReactiveSource): ProxyHandler<object> {
  return {
    get: createGetter(source, false, true),
    set: (target: object, key: string | symbol, value: unknown, receiver: object): boolean => {
      const rawValue = toRaw(value);

      const hadKey = hasOwn(target, key);
      const result = Reflect.set(target, key, rawValue, receiver);

      if (target === toRaw(receiver)) {
        if (hadKey) {
          trigger(source, target, OperationTypes.SET, key);
        } else {
          trigger(source, target, OperationTypes.ADD, key);
        }
      }
      return result;
    },
    deleteProperty: (target: object, key: string | symbol): boolean => {
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(source, target, OperationTypes.DELETE, key);
      }
      return result;
    },
  };
}

export function createTrackProxyHandles(source: ReactiveSource): ProxyHandler<object> {
  return {
    get: createGetter(source, true, false),
    set: lockSetter,
    deleteProperty: lockDeleteProperty,
    has: createHas(source),
    ownKeys: createOwnKeys(source),
  };
}

export function createReadonlyProxyHandles(source: ReactiveSource): ProxyHandler<object> {
  return {
    get: createGetter(source, false, false),
    set: lockSetter,
    deleteProperty: lockDeleteProperty,
  };
}
