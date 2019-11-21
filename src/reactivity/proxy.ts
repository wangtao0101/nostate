import { isObject } from '../utils';
import {
  createTriggerProxyHandles,
  createTrackProxyHandles,
  createReadonlyProxyHandles,
} from './handle';

export enum ReactiveSourceType {
  COMPUTED,
  COMPONENT,
}

export interface ReactiveSource {
  _isSource: true;
  type: ReactiveSourceType;
  deps: Array<Dep>;
}

export type Dep = Set<ReactiveSource>;
export type KeyToDepMap = Map<any, Dep>;
export const targetMap = new WeakMap<any, KeyToDepMap>();

const triggerRawToProxy = new WeakMap<any, WeakMap<any, any>>();
const triggerProxyToRaw = new WeakMap<any, any>();

const trackRawToProxy = new WeakMap<any, WeakMap<any, any>>();
const trackProxyToRaw = new WeakMap<any, any>();

const readonlyRawToProxy = new WeakMap<any, WeakMap<any, any>>();
const readonlyProxyToRaw = new WeakMap<any, any>();

export function getProxy<T>(
  source: ReactiveSource,
  target: T,
  toProxy: WeakMap<any, WeakMap<any, any>>,
): any {
  const sourceTargetMap = toProxy.get(target);
  if (sourceTargetMap == null) {
    return undefined;
  }
  return sourceTargetMap.get(source);
}

export function setProxy(
  source: ReactiveSource,
  target: any,
  proxy: any,
  toProxy: WeakMap<any, WeakMap<any, any>>,
): void {
  let sourceTargetMap = toProxy.get(target);
  if (sourceTargetMap == null) {
    sourceTargetMap = new WeakMap<any, any>();
    toProxy.set(target, sourceTargetMap);
  }
  sourceTargetMap.set(source, proxy);
}

function createProxy(
  source: ReactiveSource,
  target: unknown,
  toProxy: WeakMap<any, WeakMap<any, any>>,
  toRaw: WeakMap<any, any>,
  shouldTrack: boolean,
  shouldTrigger: boolean,
): any {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made proxy: ${String(target)}`);
    }
    return target;
  }

  let observed = getProxy(source, target, toProxy);
  if (observed !== void 0) {
    return observed;
  }

  if (toRaw.has(target)) {
    return target;
  }

  let handlers;
  if (shouldTrigger) {
    handlers = createTriggerProxyHandles(source);
  }
  if (shouldTrack) {
    handlers = createTrackProxyHandles(source);
  }
  handlers = createReadonlyProxyHandles(source);

  observed = new Proxy(target, handlers);

  toRaw.set(observed, target);
  setProxy(source, target, observed, toProxy);

  if (!targetMap.has(target)) {
    targetMap.set(target, new Map());
  }

  return observed;
}

// track change for reducer
export function createTriggerProxy<T extends object>(source: ReactiveSource, target: T): T {
  const observed = createProxy(source, target, triggerRawToProxy, triggerProxyToRaw, false, true);
  return observed;
}

// readonly and track dependence for computed and component
export function createTrackProxy<T extends object>(source: ReactiveSource, target: T): T {
  const observed = createProxy(source, target, trackRawToProxy, trackProxyToRaw, true, false);
  return observed;
}

// readonly for effect
export function createReadonlyProxy<T extends object>(source: ReactiveSource, target: T): T {
  const observed = createProxy(
    source,
    target,
    readonlyRawToProxy,
    readonlyProxyToRaw,
    false,
    false,
  );
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
