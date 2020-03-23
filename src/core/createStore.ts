import {
  Ref,
  TraceRef,
  isRef,
  computedTrace,
  ReactiveEffect,
  isReactive,
  reactiveTrace,
  toRaw
} from '../reactivity';
import { HookuxMeta } from './createHookux';

export type IHookuxReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function bindSetup<ISetupReturn extends Record<string, any>, T extends any[]>(
  setup: (...args: T) => ISetupReturn,
  listener: () => void,
  ...args: T
) {
  const binds = setup(...args);
  const bindsMap: Record<string, any> = {};
  const effectsSet: Set<ReactiveEffect> = new Set();

  Object.keys(binds).map(bindKey => {
    const bind = binds[bindKey];
    if (isRef(bind)) {
      const ref = computedTrace(bind as any, listener);
      bindsMap[bindKey] = ref;
      effectsSet.add(ref.effect);
    } else if (isReactive(bind)) {
      const ref = reactiveTrace(toRaw(bind), listener);
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

export function createStore() {
  const state: Record<string, any> = {};
  const listenersMap: Record<any, Function[]> = {} as any;

  const schedule = function(setup: any) {
    listenersMap[setup].map(lis => {
      lis();
    });
  };

  const mount = <ISetupReturn extends Record<string, any>, T extends any[]>(
    setup: (...args: T) => ISetupReturn,
    ...args: T
  ) => {
    const meta: HookuxMeta = (setup as any).meta;

    const actualListener = () => schedule(setup);
    const { bindsMap, effectsSet } = bindSetup(setup, actualListener, ...args);

    if (meta) {
      let moduleState: Record<string, any> = state[meta.module];
      if (moduleState == null) {
        moduleState = {} as Record<string, any>;
        state[meta.module] = moduleState;
      }
      if (moduleState[meta.name] != null) {
        throw new Error(
          `[Hookux]: Should not mound hookux on same module: ${meta.module} and same name: ${meta.name}.`
        );
      }

      moduleState[meta.name] = {
        ...bindsMap
      };
    }

    listenersMap[setup as any] = [];

    return {
      bindsMap,
      effectsSet
    };
  };

  const isMounted = function<ISetupReturn extends Record<string, any>, T extends any[]>(
    setup: (...args: T) => ISetupReturn
  ): boolean {
    return listenersMap[setup as any] != null;
  };

  const subscribe = function<ISetupReturn extends Record<string, any>, T extends any[]>(
    setup: (...args: T) => ISetupReturn,
    listener: () => void
  ) {
    listenersMap[setup as any].push(listener);
  };

  const getState = <ISetupReturn extends Record<string, any>, T extends any[]>(
    setup: (...args: T) => ISetupReturn
  ): IHookuxReturn<ISetupReturn> => {
    const meta: HookuxMeta = (setup as any).meta;
    return state[meta.module][meta.name];
  };

  const getAllState = () => state;

  return {
    mount,
    isMounted,
    subscribe,
    getState,
    getAllState
  };
}
