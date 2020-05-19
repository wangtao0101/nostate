import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop, Ref, TraceRef } from '../reactivity';
import { ISetup, bindSetup } from './create';

export type IHookuxReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useHookux<P extends Record<string, any>>(setup: ISetup<P>): IHookuxReturn<P> {
  const [, forceRender] = useReducer(s => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  const meta: any = (setup as any).meta;

  useMemo(() => {
    if (meta) {
      bindsRef.current = meta.bindsMap;
      meta.tap(scheduler);
    } else {
      const { bindsMap, effectsSet } = bindSetup(setup as ISetup<P>, scheduler);
      bindsRef.current = bindsMap;
      effectsRef.current = effectsSet;
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (meta) {
        return;
      }
      for (const effect of effectsRef.current) {
        stop(effect);
      }
    };
  }, []);

  return bindsRef.current;
}
