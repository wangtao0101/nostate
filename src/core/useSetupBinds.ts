import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import { ReactiveEffect, stop, Ref, TraceRef } from '../reactivity';
import { createBindsMap, SetupBinds } from './createSetup';
import { isReactiveTrace } from '../reactivity/traceRef';
import { toRaw, toReactive } from '../reactivity/reactive';

export type ISetupReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useSetupBinds<P extends Record<string, any>>(
  setupBinds: SetupBinds<P>
): ISetupReturn<P> {
  const [, forceRender] = useReducer((s) => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsMapRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    const { bindsMap, effectsSet } = createBindsMap(setupBinds, scheduler);
    bindsMapRef.current = bindsMap;
    effectsRef.current = effectsSet;
  }, []);

  useLayoutEffect(() => {
    return () => {
      for (const effect of effectsRef.current) {
        stop(effect);
      }
    };
  }, []);

  const newBindsMap: any = {};
  Object.keys(bindsMapRef.current).map((bindKey) => {
    const ref = bindsMapRef.current[bindKey];
    if (isReactiveTrace(ref)) {
      const value = toReactive(toRaw(ref.value), null, ref.effect);
      newBindsMap[bindKey] = value;
    } else {
      newBindsMap[bindKey] = ref;
    }
  });

  return newBindsMap;
}
