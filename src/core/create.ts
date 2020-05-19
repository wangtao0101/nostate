import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  toRaw,
  ReactiveEffect
} from '../reactivity';

export const listenersMap: Record<any, Function[]> = {} as any;

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export type ISetup<P extends Record<string, any>> = () => P;

export function bindSetup<P extends Record<string, any>>(fn: ISetup<P>, call: () => void) {
  const binds = fn();
  const bindsMap: Record<string, any> = {};
  const effectsSet: Set<ReactiveEffect> = new Set();

  Object.keys(binds).map(bindKey => {
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
    effectsSet
  };
}

export function create<P extends Record<string, any>>(fn: ISetup<P>) {
  listenersMap[fn as any] = [];

  const call = function() {
    listenersMap[fn as any].map(lis => {
      lis();
    });
  };

  const tap = (listener: any) => listenersMap[fn as any].push(listener);
  const untap = (listener: any) => {
    const listeners = listenersMap[fn as any];
    const index = listeners.findIndex(l => l === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };

  const { bindsMap, effectsSet } = bindSetup(fn, call);

  (fn as any).meta = {
    bindsMap,
    effectsSet,
    tap,
    untap
  };

  return fn;
}
