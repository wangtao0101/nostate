import { isObject, hasOwn } from '../utils';
import { OperationTypes, track, trigger, ReactiveEffect } from './effect';
import { toRaw, reactive } from './reactive';
import { TRACK_LOCKED, VALUE_LOCKED } from './lock';

function createGetter(effect?: ReactiveEffect) {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver);
    const isObj = isObject(res);
    if (effect) {
      // must be component effect, should track
      track(target, OperationTypes.GET, effect, key);
      return isObj ? reactive(res, effect) : res;
    }
    if (!TRACK_LOCKED) {
      track(target, OperationTypes.GET, undefined, key);
    }
    return isObj ? reactive(res) : res;
  };
}

function createHas(effect?: ReactiveEffect) {
  return function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key);
    if (effect && !TRACK_LOCKED) {
      track(target, OperationTypes.HAS, effect, key);
    }
    return result;
  };
}

function createOwnKeys(effect?: ReactiveEffect) {
  return function ownKeys(target: object): (string | number | symbol)[] {
    if (effect && !TRACK_LOCKED) {
      track(target, OperationTypes.HAS, effect);
    }
    return Reflect.ownKeys(target);
  };
}

const get = createGetter();
const has = createHas();
const ownKeys = createOwnKeys();

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

export function createReactiveProxyHandles(): ProxyHandler<object> {
  return {
    get,
    set: (target: object, key: string | symbol, value: unknown, receiver: object): boolean => {
      if (VALUE_LOCKED) {
        throw new Error(`Cannot set key: ${String(key)} of hux state except in reducer.`);
      }

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
      if (VALUE_LOCKED) {
        throw new Error(`Cannot delete key: ${String(key)} of hux state except in reducer.`);
      }
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(target, OperationTypes.DELETE, key);
      }
      return result;
    },
    has,
    ownKeys,
  };
}

export function createTrackProxyHandles(effect: ReactiveEffect): ProxyHandler<object> {
  return {
    get: createGetter(effect),
    set: lockSetter,
    deleteProperty: lockDeleteProperty,
    has: createHas(effect),
    ownKeys: createOwnKeys(effect),
  };
}
