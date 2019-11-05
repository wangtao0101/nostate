import { isObject } from '../utils';

export const targetMap = new WeakMap<any, any>();

const rawToProxy = new WeakMap<any, any>();
const proxyToRaw = new WeakMap<any, any>();

// const rawToTrackProxy = new WeakMap<any, any>();
// const trackProxyToRaw = new WeakMap<any, any>();

// const rawToReadonly = new WeakMap<any, any>();
// const readonlyToRaw = new WeakMap<any, any>();

export function toRaw<T>(observed: T): T {
  return proxyToRaw.get(observed) || observed;
}

function createProxy(
  target: unknown,
  toProxy: WeakMap<any, any>,
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

  const observed = toProxy.get(target);
  if (observed !== void 0) {
    return observed;
  }

  if (toRaw.has(target)) {
    return target;
  }

  if (shouldTrigger) {
    return createTriggerProxy(target);
  }
  if (shouldTrack) {
    return createTrackProxy(target);
  }
  return createReadonlyProxy(target);
}

// track change for reducer
export function createTriggerProxy<T extends object>(target: T): T {
  const observed = createProxy(target, rawToProxy, proxyToRaw, false, true);

  rawToProxy.set(target, observed);
  proxyToRaw.set(observed, target);

  if (!targetMap.has(target)) {
    targetMap.set(target, new Map());
  }

  return observed;
}

// readonly and track dependence for computed and component
export function createTrackProxy<T extends object>(target: T): T {
  return target;
}

// readonly for effect
export function createReadonlyProxy<T extends object>(target: T): T {
  return target;
}
