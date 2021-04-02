import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop, Ref, TraceRef } from '../reactivity';
import { ISetup, createBindsMap } from './createSetup';

export type ISetupReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useCreateSetup<P extends Record<string, any>, T extends any[]>(
  setup: ISetup<P, T>,
  ...args: T
): ISetupReturn<P> {
  const [, forceRender] = useReducer((s) => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    const binds = setup(...args);
    const { bindsMap, effectsSet } = createBindsMap({ binds }, scheduler);
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
