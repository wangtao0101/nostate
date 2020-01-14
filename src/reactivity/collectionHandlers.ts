import { toRaw, toReactive } from './reactive';
import { ReactiveEffect, track, ITERATE_KEY, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { hasChanged } from '../utils';

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
  return function get(target: MapTypes, key: unknown): any {
    target = toRaw(target);
    key = toRaw(key);

    track(target, TrackOpTypes.GET, key, effect);

    return toReactive(getProto(target).get.call(target, key), effect);
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
      return callback.call(observed, toReactive(value, effect), toReactive(key, effect), observed);
    }
    return getProto(target).forEach.call(target, wrappedCallback, thisArg);
  };
}

const get = createGetter();
const has = createHas();
const size = createSize();

const mutableInstrumentations: Record<string, Function | number> = {
  get(this: MapTypes, key: unknown) {
    return get(this, key);
  },
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

function createMutableCollectionHandles(): ProxyHandler<CollectionTypes> {
  return {
    get: (target: CollectionTypes, key: string | symbol, receiver: CollectionTypes): any =>
      Reflect.get(
        collectionMethods.includes(key) && key in target ? mutableInstrumentations : target,
        key,
        receiver
      )
  };
}

export const mutableCollectionHandles = createMutableCollectionHandles();
