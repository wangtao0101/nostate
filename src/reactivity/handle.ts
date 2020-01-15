import { hasOwn, isSymbol, hasChanged } from '../utils';
import { track, trigger, ReactiveEffect, ITERATE_KEY } from './effect';
import { toRaw, toReactive } from './reactive';
import { VALUE_LOCKED } from './lock';
import { TrackOpTypes, TriggerOpTypes } from './operations';

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
);

function createGetter(effect?: ReactiveEffect) {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) && builtInSymbols.has(key)) {
      return res;
    }
    track(target, TrackOpTypes.GET, key, effect);
    return toReactive(res, effect);
  };
}

function createHas(effect?: ReactiveEffect) {
  return function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key);
    track(target, TrackOpTypes.HAS, key, effect);
    return result;
  };
}

function createOwnKeys(effect?: ReactiveEffect) {
  return function ownKeys(target: object): (string | number | symbol)[] {
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);
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
  _receiver: object
): boolean {
  throw new Error(`Cannot set key: ${String(key)}, hux state is readonly except in reducer.`);
}

function lockDeleteProperty(_target: object, key: string | symbol): boolean {
  throw new Error(`Cannot delete key: ${String(key)}, hux state is readonly except in reducer.`);
}

function createMutableHandles(): ProxyHandler<object> {
  return {
    get,
    set: (target: object, key: string | symbol, value: unknown, receiver: object): boolean => {
      if (VALUE_LOCKED) {
        throw new Error(`Cannot set key: ${String(key)}, hux state is readonly except in reducer.`);
      }

      const rawValue = toRaw(value);
      const oldValue = (target as any)[key];

      const hadKey = hasOwn(target, key);
      const result = Reflect.set(target, key, rawValue, receiver);

      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, TriggerOpTypes.ADD, key);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, TriggerOpTypes.SET, key);
        }
      }
      return result;
    },
    deleteProperty: (target: object, key: string | symbol): boolean => {
      if (VALUE_LOCKED) {
        throw new Error(
          `Cannot delete key: ${String(key)}, hux state is readonly except in reducer.`
        );
      }
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key);
      }
      return result;
    },
    has,
    ownKeys
  };
}

export const mutableHandles = createMutableHandles();

export function createTrackHandles(effect: ReactiveEffect): ProxyHandler<object> {
  return {
    get: createGetter(effect),
    set: lockSetter,
    deleteProperty: lockDeleteProperty,
    has: createHas(effect),
    ownKeys: createOwnKeys(effect)
  };
}
