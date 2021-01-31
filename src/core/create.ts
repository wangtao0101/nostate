import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  toRaw,
  ReactiveEffect,
} from '../reactivity';

export const listenersMap: Record<any, Function[]> = {} as any;

export type ISetup<P extends Record<string, any>, T extends any[]> = (..._args: T) => P;

export function bindSetup<P extends Record<string, any>, T extends any[]>(
  fn: ISetup<P, T>,
  call: () => void,
  ...args: T
) {
  const binds = fn(...args);
  const bindsMap: Record<string, any> = {};
  const effectsSet: Set<ReactiveEffect> = new Set();

  Object.keys(binds).map((bindKey) => {
    const bind = binds[bindKey];
    if (isRef(bind)) {
      const ref = computedTrace(bind as any, call);
      bindsMap[bindKey] = ref;
      effectsSet.add(ref.effect);
    } else if (isReactive(bind)) {
      const ref = reactiveTrace(toRaw(bind), call);
      bindsMap[bindKey] = ref.value;
      effectsSet.add(ref.effect);
    } else {
      bindsMap[bindKey] = bind;
    }
  });

  return {
    bindsMap,
    effectsSet,
  };
}

export function create<P extends Record<string, any>, T extends any[]>(
  fn: ISetup<P, T>,
  ...args: T
): ISetup<P, []> {
  const emptyFn = () => {};

  listenersMap[emptyFn as any] = [];

  const call = function () {
    listenersMap[emptyFn as any].map((lis) => {
      lis();
    });
  };

  const tap = (listener: any) => listenersMap[emptyFn as any].push(listener);
  const untap = (listener: any) => {
    const listeners = listenersMap[emptyFn as any];
    const index = listeners.findIndex((l) => l === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };

  const { bindsMap, effectsSet } = bindSetup(fn, call, ...args);

  (emptyFn as any).meta = {
    bindsMap,
    effectsSet,
    tap,
    untap,
  };

  return emptyFn as any;
}
