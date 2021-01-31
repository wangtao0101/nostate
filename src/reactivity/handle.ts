import { hasOwn, isSymbol, hasChanged } from '../utils';
import { track, trigger, ReactiveEffect, ITERATE_KEY } from './effect';
import { ProxyState, toRaw, toReactive } from './reactive';
import { VALUE_LOCKED } from './lock';
import { TrackOpTypes, TriggerOpTypes } from './operations';

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
);

function createGetter(effect?: ReactiveEffect) {
  return function get(state: ProxyState, key: string | symbol, receiver: object): any {
    const target = state.base;
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) && builtInSymbols.has(key)) {
      return res;
    }
    track(target, TrackOpTypes.GET, key, effect);
    return toReactive(res, state, effect);
  };
}

function createHas(effect?: ReactiveEffect) {
  return function has(state: ProxyState, key: string | symbol): boolean {
    const target = state.base;
    const result = Reflect.has(target, key);
    track(target, TrackOpTypes.HAS, key, effect);
    return result;
  };
}

function createOwnKeys(effect?: ReactiveEffect) {
  return function ownKeys(state: ProxyState): (string | number | symbol)[] {
    const target = state.base;
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
  throw new Error(
    `Cannot set key: ${String(key)}, nostate state is readonly except in corresponding reducer.`
  );
}

function lockDeleteProperty(_target: object, key: string | symbol): boolean {
  throw new Error(
    `Cannot delete key: ${String(key)}, nostate state is readonly except in corresponding reducer.`
  );
}

function createMutableHandles(): ProxyHandler<object> {
  return {
    get,
    set: (state: ProxyState, key: string | symbol, value: unknown, receiver: object): boolean => {
      if (VALUE_LOCKED) {
        throw new Error(
          `Cannot set key: ${String(
            key
          )}, nostate state is readonly except in corresponding reducer.`
        );
      }
      const target = state.base;
      const rawValue = toRaw(value);
      const oldValue = (target as any)[key];

      const hadKey = hasOwn(target, key);
      let result;
      // if receiver is our reactive proxy
      if (target === toRaw(receiver)) {
        result = Reflect.set(target, key, rawValue);
        if (!hadKey) {
          trigger(target, TriggerOpTypes.ADD, key);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, TriggerOpTypes.SET, key);
        }
      } else {
        result = Reflect.set(target, key, rawValue, receiver);
      }
      return result;
    },
    deleteProperty: (state: ProxyState, key: string | symbol): boolean => {
      if (VALUE_LOCKED) {
        throw new Error(
          `Cannot delete key: ${String(
            key
          )}, nostate state is readonly except in corresponding reducer.`
        );
      }
      const target = state.base;
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key);
      }
      return result;
    },
    getOwnPropertyDescriptor(state: ProxyState, prop) {
      const target = state.base;
      const desc = Reflect.getOwnPropertyDescriptor(target, prop);
      if (!desc) return desc;
      return {
        writable: true,
        configurable: true,
        enumerable: desc.enumerable,
        value: target[prop]
      };
    },
    getPrototypeOf(state: ProxyState) {
      return Object.getPrototypeOf(state.base);
    },
    setPrototypeOf(state: ProxyState, prototype: any) {
      return Object.setPrototypeOf(state.base, prototype);
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
