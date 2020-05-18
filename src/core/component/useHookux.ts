import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop } from '../../reactivity';
import { bindSetup, IHookuxReturn } from '../createStore';
import { GlobalSetupReturn, ISetup } from '../setup';

export function useHookux<P extends Record<string, any>, T extends any[]>(
  setup: ISetup<T, P> | GlobalSetupReturn,
  ...args: T
): IHookuxReturn<P> {
  const [, forceRender] = useReducer(s => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    if ((setup as GlobalSetupReturn)._isGlobal) {
      const setupReturn = setup as GlobalSetupReturn;
      bindsRef.current = setupReturn.bindsMap;
      setupReturn.tap(scheduler);
    } else {
      const { bindsMap, effectsSet } = bindSetup(setup as ISetup<T, P>, scheduler, ...args);
      bindsRef.current = bindsMap;
      effectsRef.current = effectsSet;
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      if ((setup as GlobalSetupReturn)._isGlobal) {
        return;
      }
      for (const effect of effectsRef.current) {
        stop(effect);
      }
    };
  }, []);

  return bindsRef.current;
}
