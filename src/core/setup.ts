import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  toRaw,
  ReactiveEffect
} from '../reactivity';

const listenersMap: Record<any, Function[]> = {} as any;

export type ISetup<T extends any[], P extends Record<string, any>> = (...args: T) => P;
export type GlobalSetupReturn = ReturnType<typeof setup>;

export function bindSetup<P extends Record<string, any>, T extends any[]>(
  fn: ISetup<T, P>,
  call: () => void,
  ...args: T
) {
  const binds = fn(...args);
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

export function setup<P extends Record<string, any>, T extends any[]>(
  fn: ISetup<T, P>,
  ...args: T
) {
  const call = function() {
    listenersMap[fn as any].map(lis => {
      lis();
    });
  };

  const tap = (listener: any) => listenersMap[fn as any].push(listener);

  const { bindsMap, effectsSet } = bindSetup(fn, call, ...args);

  return {
    bindsMap,
    effectsSet,
    call,
    tap,
    _isGlobal: true
  };
}
