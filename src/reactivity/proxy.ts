import { isObject } from '../utils';
import { createTrackProxyHandles, createReactiveProxyHandles } from './handle';
import { ReactiveEffect, targetMap, ReactiveEffectType } from './effect';

const rawToProxy = new WeakMap<any, WeakMap<any, any>>();
const proxyToRaw = new WeakMap<any, any>();

const trackRawToProxy = new WeakMap<any, WeakMap<any, any>>();
const trackProxyToRaw = new WeakMap<any, any>();

const EMPTY_EFFECT: ReactiveEffect = {
  _isEffect: true,
  type: ReactiveEffectType.EFFECT,
  deps: [],
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

function createProxy(
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

export function createReactiveProxy<T extends object>(target: T): T {
  const observed = createProxy(target, rawToProxy, proxyToRaw);
  return observed;
}

// readonly and track dependence for computed and component
export function createTrackProxy<T extends object>(target: T, source?: ReactiveEffect): T {
  const observed = createProxy(target, trackRawToProxy, trackProxyToRaw, source);
  return observed;
}

export function toRaw<T>(observed: T): T {
  return (
    trackProxyToRaw.get(observed) ||
    trackProxyToRaw.get(observed) ||
    trackProxyToRaw.get(observed) ||
    observed
  );
}
