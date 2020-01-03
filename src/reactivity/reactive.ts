import { isObject, toRawType } from '../utils';
import { createTrackHandles, mutableHandles } from './handle';
import { ReactiveEffect, targetMap } from './effect';
import { makeMap } from '../utils/makeMap';
import { mutableCollectionHandles } from './collectionHandlers';

const rawToReactive = new WeakMap<any, WeakMap<any, any>>();
const reactiveToRaw = new WeakMap<any, any>();

const trackRawToReactive = new WeakMap<any, WeakMap<any, any>>();
const trackReactiveToRaw = new WeakMap<any, any>();

const EMPTY_EFFECT: ReactiveEffect = {} as any;

const collectionTypes = new Set<Function>([Set, Map, WeakMap, WeakSet]);
const isObservableType = /*#__PURE__*/ makeMap('Object,Array,Map,Set,WeakMap,WeakSet');

const canObserve = (value: any): boolean => {
  return isObservableType(toRawType(value));
};

export function getProxy<T>(
  target: T,
  toProxy: WeakMap<any, WeakMap<any, any>>,
  effect: ReactiveEffect = EMPTY_EFFECT,
): any {
  const sourceTargetMap = toProxy.get(target);
  if (sourceTargetMap == null) {
    return undefined;
  }
  return sourceTargetMap.get(effect);
}

export function setProxy(
  target: any,
  proxy: any,
  toProxy: WeakMap<any, WeakMap<any, any>>,
  effect: ReactiveEffect = EMPTY_EFFECT,
): void {
  let sourceTargetMap = toProxy.get(target);
  if (sourceTargetMap == null) {
    sourceTargetMap = new WeakMap<any, any>();
    toProxy.set(target, sourceTargetMap);
  }
  sourceTargetMap.set(effect, proxy);
}

function createReactiveObject(
  target: unknown,
  toProxy: WeakMap<any, WeakMap<any, any>>,
  toRaw: WeakMap<any, any>,
  effect?: ReactiveEffect,
): any {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`);
    }
    return target;
  }

  let observed = getProxy(target, toProxy, effect);
  if (observed !== void 0) {
    return observed;
  }

  if (toRaw.has(target)) {
    return target;
  }

  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target;
  }

  let handlers;
  const isCollection = collectionTypes.has(target.constructor);
  if (effect) {
    handlers = createTrackHandles(effect);
  } else {
    handlers = isCollection ? mutableCollectionHandles : mutableHandles;
  }

  observed = new Proxy(target, handlers);

  toRaw.set(observed, target);
  setProxy(target, observed, toProxy);

  if (!targetMap.has(target)) {
    targetMap.set(target, new Map());
  }

  return observed;
}

export function reactive<T>(target: T, effect?: ReactiveEffect): T {
  if (effect) {
    return createReactiveObject(target, trackRawToReactive, trackReactiveToRaw, effect);
  }
  return createReactiveObject(target, rawToReactive, reactiveToRaw);
}

export const toReactive = <T extends unknown>(value: T, effect?: ReactiveEffect): T =>
  isObject(value) ? reactive(value, effect) : value;

export function isReactive(value: unknown): boolean {
  return reactiveToRaw.has(value) || trackReactiveToRaw.has(value);
}

export function toRaw<T>(observed: T): T {
  return reactiveToRaw.get(observed) || trackReactiveToRaw.get(observed) || observed;
}
