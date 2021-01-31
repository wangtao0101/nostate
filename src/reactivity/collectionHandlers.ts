import { ProxyState, toRaw, toReactive } from './reactive';
import { ReactiveEffect, track, ITERATE_KEY, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { hasChanged, capitalize } from '../utils';
import { VALUE_LOCKED } from './lock';

export type CollectionTypes = IterableCollections | WeakCollections;

type IterableCollections = Map<any, any> | Set<any>;
type WeakCollections = WeakMap<any, any> | WeakSet<any>;
// type MapTypes = Map<any, any> | WeakMap<any, any>;
// type SetTypes = Set<any> | WeakSet<any>;

const getProto = <T extends CollectionTypes>(v: T): any => Reflect.getPrototypeOf(v);

const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
const collectionMethods: Array<string | symbol> = ([
  'get',
  'size',
  'has',
  'add',
  'set',
  'delete',
  'clear',
  'forEach'
] as Array<string | symbol>).concat(...iteratorMethods);

function createGetter(effect?: ReactiveEffect) {
  return function get(state: ProxyState, key: unknown): any {
    const target = state.base;
    key = toRaw(key);

    track(target, TrackOpTypes.GET, key, effect);

    return toReactive(getProto(target).get.call(target, key), state, effect);
  };
}

function createHas(effect?: ReactiveEffect) {
  return function has(this: ProxyState, key: unknown): boolean {
    const target = this.base;
    key = toRaw(key);
    track(target, TrackOpTypes.HAS, key, effect);
    return getProto(target).has.call(target, key);
  };
}

function createSize(effect?: ReactiveEffect): (state: ProxyState) => number {
  return function size(state: ProxyState): number {
    const target = state.base;
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);
    return Reflect.get(getProto(target), 'size', target);
  };
}

function add(this: ProxyState, value: unknown): any {
  if (VALUE_LOCKED) {
    throw new Error(
      `Cannot add value: ${String(
        value
      )}, nostate state is readonly except in corresponding reducer.`
    );
  }
  const target = this.base;
  value = toRaw(value);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  const result = proto.add.call(target, value);
  if (!hadKey) {
    trigger(this, TriggerOpTypes.ADD, value);
  }
  return result;
}

function set(this: ProxyState, key: unknown, value: unknown): void {
  if (VALUE_LOCKED) {
    throw new Error(
      `Cannot set key: ${String(key)}, nostate state is readonly except in corresponding reducer.`
    );
  }
  const target = this.base;
  value = toRaw(value);
  key = toRaw(key);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, key);
  const oldValue = proto.get.call(target, key);
  const result = proto.set.call(target, key, value);

  if (!hadKey) {
    trigger(this, TriggerOpTypes.ADD, key);
  } else if (hasChanged(value, oldValue)) {
    trigger(this, TriggerOpTypes.SET, key);
  }

  return result;
}

function deleteEntry(this: ProxyState, key: unknown): void {
  if (VALUE_LOCKED) {
    throw new Error(`Cannot delete key: ${String(key)} of nostate state except in reducer.`);
  }

  const target = this.base;
  key = toRaw(key);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, key);
  // forward the operation before queueing reactions
  const result = proto.delete.call(target, key);
  if (hadKey) {
    trigger(this, TriggerOpTypes.DELETE, key);
  }
  return result;
}

function clear(this: ProxyState): void {
  const target = this.base;
  const hadItems = target.size !== 0;
  // forward the operation before queueing reactions
  const result = getProto(target).clear.call(target);
  if (hadItems) {
    trigger(this, TriggerOpTypes.CLEAR, void 0);
  }
  return result;
}

function createForEach(effect?: ReactiveEffect) {
  return function forEach(this: ProxyState, callback: Function, thisArg?: unknown): any {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const observed = this;
    const target = this.base;

    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);

    // important: create sure the callback is
    // 1. invoked with the reactive map as `this` and 3rd arg
    // 2. the value received should be a corresponding reactive/readonly.
    function wrappedCallback(value: unknown, key: unknown): any {
      return callback.call(
        observed,
        toReactive(value, observed, effect),
        toReactive(key, observed, effect),
        observed
      );
    }
    return getProto(target).forEach.call(target, wrappedCallback, thisArg);
  };
}

function createIterableMethod(method: string | symbol, effect?: ReactiveEffect) {
  return function(this: ProxyState, ...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const observed = this;
    const target = observed.base;
    const isPair = method === 'entries' || (method === Symbol.iterator && target instanceof Map);
    const innerIterator = getProto(target)[method].apply(target, args);
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);
    // return a wrapped iterator which returns observed versions of the
    // values emitted from the real iterator
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done
          ? { value, done }
          : {
              value: isPair
                ? [toReactive(value[0], observed, effect), toReactive(value[1], observed, effect)]
                : toReactive(value, observed, effect),
              done
            };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}

const get = createGetter();
const has = createHas();
const size = createSize();

const mutableInstrumentations: Record<string, Function | number> = {
  get(this: ProxyState, key: unknown) {
    return get(this, key);
  },
  get size() {
    return size((this as unknown) as ProxyState);
  },
  has,
  add,
  set,
  delete: deleteEntry,
  clear,
  forEach: createForEach()
};

iteratorMethods.forEach(method => {
  mutableInstrumentations[method as string] = createIterableMethod(method);
});

function createReadonlyMethod(method: Function, type: TriggerOpTypes): Function {
  return function(this: ProxyState, ...args: unknown[]) {
    const key = args[0] ? `on key "${args[0]}" ` : ``;
    throw new Error(
      `${capitalize(
        type
      )} operation ${key} failed: nostate state is readonly except in corresponding reducer.`
    );
  };
}

const readonlyMethod = {
  add: createReadonlyMethod(add, TriggerOpTypes.ADD),
  set: createReadonlyMethod(set, TriggerOpTypes.SET),
  delete: createReadonlyMethod(deleteEntry, TriggerOpTypes.DELETE),
  clear: createReadonlyMethod(clear, TriggerOpTypes.CLEAR)
};

function createMutableCollectionHandles(effect?: ReactiveEffect): ProxyHandler<ProxyState> {
  return {
    // create a proxy for Collection's method, also for ProxyState
    get: (state: ProxyState, key: string | symbol, receiver: CollectionTypes): any => {
      const target = state.base;
      const isCollection = collectionMethods.includes(key) && key in target;
      if (!effect) {
        return Reflect.get(isCollection ? mutableInstrumentations : state, key, receiver);
      }

      const newGet = createGetter(effect);
      const newSize = createSize(effect);
      const newHas = createHas(effect);
      const newForEach = createForEach(effect);

      const readonlyInstrumentations: Record<string, Function | number> = {
        get(this: ProxyState, key: unknown) {
          return newGet(this, key);
        },
        get size() {
          return newSize((this as unknown) as ProxyState);
        },
        has: newHas,
        forEach: newForEach,
        ...readonlyMethod
      };

      iteratorMethods.forEach(method => {
        readonlyInstrumentations[method as string] = createIterableMethod(method, effect);
      });

      return Reflect.get(isCollection ? readonlyInstrumentations : state, key, receiver);
    },
    getPrototypeOf(state: ProxyState) {
      return Object.getPrototypeOf(state.base);
    }
  };
}

export const mutableCollectionHandles = createMutableCollectionHandles();

export function createTrackCollectionHandles(effect: ReactiveEffect): ProxyHandler<ProxyState> {
  return createMutableCollectionHandles(effect);
}
