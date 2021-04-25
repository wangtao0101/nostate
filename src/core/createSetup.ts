import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  toRaw,
  ReactiveEffect,
} from '../reactivity';

export type ISetup<P extends Record<string, any>, T extends any[]> = (..._args: T) => P;

export interface SetupBinds<P extends Record<string, any>> {
  binds: P;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createBindsMap<P extends Record<string, any>>(
  setupBinds: SetupBinds<P>,
  callback: () => void
) {
  const binds = setupBinds.binds;
  const bindsMap: Record<string, any> = {};
  const effectsSet: Set<ReactiveEffect> = new Set();

  Object.keys(binds).map((bindKey) => {
    const bind = binds[bindKey];
    if (isRef(bind)) {
      const ref = computedTrace(bind as any, callback);
      bindsMap[bindKey] = ref;
      effectsSet.add(ref.effect);
    } else if (isReactive(bind)) {
      const ref = reactiveTrace(toRaw(bind), callback);
      bindsMap[bindKey] = ref;
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

export function createSetup<P extends Record<string, any>, T extends any[]>(
  fn: ISetup<P, T>,
  ...args: T
): SetupBinds<P> {
  const binds = fn(...args);

  return {
    binds,
  };
}
