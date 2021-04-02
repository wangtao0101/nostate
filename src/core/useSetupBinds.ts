import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop, Ref, TraceRef } from '../reactivity';
import { createBindsMap, SetupBinds } from './createSetup';

export type ISetupReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useSetupBinds<P extends Record<string, any>>(
  setupBinds: SetupBinds<P>
): ISetupReturn<P> {
  const [, forceRender] = useReducer((s) => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    const { bindsMap, effectsSet } = createBindsMap(setupBinds, scheduler);
    bindsRef.current = bindsMap;
    effectsRef.current = effectsSet;
  }, []);

  useLayoutEffect(() => {
    return () => {
      for (const effect of effectsRef.current) {
        stop(effect);
      }
    };
  }, []);

  return bindsRef.current;
}
