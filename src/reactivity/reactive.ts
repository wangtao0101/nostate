import { isObject } from '../utils';
import { createTrackProxyHandles, createReactiveProxyHandles } from './handle';
import { ReactiveEffect, targetMap } from './effect';

const rawToReactive = new WeakMap<any, WeakMap<any, any>>();
const reactiveToRaw = new WeakMap<any, any>();

const trackRawToReactive = new WeakMap<any, WeakMap<any, any>>();
const trackReactiveToRaw = new WeakMap<any, any>();

const EMPTY_EFFECT: ReactiveEffect = {} as any;

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
      console.warn(`value cannot be made proxy: ${String(target)}`);
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

  let handlers;
  if (effect) {
    handlers = createTrackProxyHandles(effect);
  }

  handlers = createReactiveProxyHandles();

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

export function isReactive(value: unknown): boolean {
  return reactiveToRaw.has(value) || trackReactiveToRaw.has(value);
}

export function toRaw<T>(observed: T): T {
  return reactiveToRaw.get(observed) || trackReactiveToRaw.get(observed) || observed;
}
