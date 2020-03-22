import { useMemo, useCallback, useRef, useLayoutEffect, useContext } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop } from '../../reactivity';
import { HookuxMeta } from '../createHookux';
import { HookuxContext } from './context';
import { bindSetup, IHookuxReturn } from '../createStore';

export function useHookux<ISetupReturn extends Record<string, any>, T extends any[]>(
  setup: (...args: T) => ISetupReturn,
  ...args: T
): IHookuxReturn<ISetupReturn> {
  const [, forceRender] = useReducer(s => s + 1, 0);
  const context = useContext(HookuxContext);

  const meta: HookuxMeta = (setup as any).meta;

  if (meta && context == null) {
    throw new Error(
      '[Hookux]: Should wrap all react element in Provider like: <Provider> <Element /></Provider>.'
    );
  }

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    if (meta && meta.global) {
      if (context.store.isMounted(setup)) {
        bindsRef.current = context.store.getState(setup);
      } else {
        const { bindsMap } = context.store.mount(setup, ...args);
        bindsRef.current = bindsMap;
      }
      context.store.subscribe(setup, scheduler);
    } else {
      const { bindsMap, effectsSet } = bindSetup(setup, scheduler, ...args);
      bindsRef.current = bindsMap;
      effectsRef.current = effectsSet;
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (meta && meta.global) {
        return;
      }
      for (const effect of effectsRef.current) {
        stop(effect);
      }
    };
  }, []);

  return bindsRef.current;
}
