import { ProxyState, toRaw, toReactive } from './reactive';
import { ReactiveEffect, track, ITERATE_KEY, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { hasChanged, capitalize } from '../utils';
import { VALUE_LOCKED } from './lock';

export type CollectionTypes = IterableCollections | WeakCollections;

type IterableCollections = Map<any, any> | Set<any>;
type WeakCollections = WeakMap<any, any> | WeakSet<any>;
type MapTypes = Map<any, any> | WeakMap<any, any>;
type SetTypes = Set<any> | WeakSet<any>;

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
    // target = toRaw(state);
    key = toRaw(key);

    track(target, TrackOpTypes.GET, key, effect);

    return toReactive(getProto(target.base).get.call(target.base, key), target, effect);
  };
}

function createHas(effect?: ReactiveEffect) {
  return function has(this: CollectionTypes, key: unknown): boolean {
    const target = toRaw(this);
    key = toRaw(key);
    track(target, TrackOpTypes.HAS, key, effect);
    return getProto(target).has.call(target, key);
  };
}

function createSize(effect?: ReactiveEffect): (target: IterableCollections) => number {
  return function size(target: IterableCollections): number {
    target = toRaw(target);
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);
    return Reflect.get(getProto(target), 'size', target);
  };
}

function add(this: SetTypes, value: unknown): any {
  if (VALUE_LOCKED) {
    throw new Error(
      `Cannot add value: ${String(
        value
      )}, nostate state is readonly except in corresponding reducer.`
    );
  }
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  const result = proto.add.call(target, value);
  if (!hadKey) {
    trigger(target, TriggerOpTypes.ADD, value);
  }
  return result;
}

function set(this: MapTypes, key: unknown, value: unknown): void {
  if (VALUE_LOCKED) {
    throw new Error(
      `Cannot set key: ${String(key)}, nostate state is readonly except in corresponding reducer.`
    );
  }

  value = toRaw(value);
  key = toRaw(key);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, key);
  const oldValue = proto.get.call(target, key);
  const result = proto.set.call(target, key, value);

  if (!hadKey) {
    trigger(target, TriggerOpTypes.ADD, key);
  } else if (hasChanged(value, oldValue)) {
    trigger(target, TriggerOpTypes.SET, key);
  }

  return result;
}

function deleteEntry(this: CollectionTypes, key: unknown): void {
  if (VALUE_LOCKED) {
    throw new Error(`Cannot delete key: ${String(key)} of nostate state except in reducer.`);
  }
  key = toRaw(key);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, key);
  // forward the operation before queueing reactions
  const result = proto.delete.call(target, key);
  if (hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key);
  }
  return result;
}

function clear(this: IterableCollections): void {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  // forward the operation before queueing reactions
  const result = getProto(target).clear.call(target);
  if (hadItems) {
    trigger(target, TriggerOpTypes.CLEAR, void 0);
  }
  return result;
}

function createForEach(effect?: ReactiveEffect) {
  return function forEach(this: IterableCollections, callback: Function, thisArg?: unknown): any {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const observed = this;
    const target = toRaw(observed);

    track(target, TrackOpTypes.ITERATE, ITERATE_KEY, effect);

    // important: create sure the callback is
    // 1. invoked with the reactive map as `this` and 3rd arg
    // 2. the value received should be a corresponding reactive/readonly.
    function wrappedCallback(value: unknown, key: unknown): any {
      return callback.call(
        observed,
        toReactive(value, null, effect),
        toReactive(key, null, effect),
        observed
      );
    }
    return getProto(target).forEach.call(target, wrappedCallback, thisArg);
  };
}

function createIterableMethod(method: string | symbol, effect?: ReactiveEffect) {
  return function(this: IterableCollections, ...args: unknown[]) {
    const target = toRaw(this);
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
                ? [toReactive(value[0], null, effect), toReactive(value[1], null, effect)]
                : toReactive(value, null, effect),
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
  get(this: MapTypes, key: unknown) {
    // @ts-ignore
    return get(this, key);
  },
  //@ts-ignore
  get size(this: IterableCollections) {
    return size(this);
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
  return function(this: CollectionTypes, ...args: unknown[]) {
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

function createMutableCollectionHandles(effect?: ReactiveEffect): ProxyHandler<CollectionTypes> {
  return {
    get: (target: CollectionTypes, key: string | symbol, receiver: CollectionTypes): any => {
      const isCollection = collectionMethods.includes(key) && key in target;
      if (!effect) {
        return Reflect.get(isCollection ? mutableInstrumentations : target, key, receiver);
      }

      const newGet = createGetter(effect);
      const newSize = createSize(effect);
      const newHas = createHas(effect);
      const newForEach = createForEach(effect);

      const readonlyInstrumentations: Record<string, Function | number> = {
        get(this: MapTypes, key: unknown) {
          // @ts-ignore
          return newGet(this, key);
        },
        //@ts-ignore
        get size(this: IterableCollections) {
          return newSize(this);
        },
        has: newHas,
        forEach: newForEach,
        ...readonlyMethod
      };

      iteratorMethods.forEach(method => {
        readonlyInstrumentations[method as string] = createIterableMethod(method, effect);
      });

      return Reflect.get(isCollection ? readonlyInstrumentations : target, key, receiver);
    }
  };
}

export const mutableCollectionHandles = createMutableCollectionHandles();

export function createTrackCollectionHandles(
  effect: ReactiveEffect
): ProxyHandler<CollectionTypes> {
  return createMutableCollectionHandles(effect);
}
