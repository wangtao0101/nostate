import { useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useReducer } from 'react';
import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  Ref,
  TraceRef,
  toRaw,
  ReactiveEffect,
  stop
} from '../reactivity';

type WrapTanceRef<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useHux<RawBindings extends Record<string, any>, T extends any[]>(
  setup: (...args: T) => RawBindings,
  ...args: T
): WrapTanceRef<RawBindings> {
  const [, forceRender] = useReducer(s => s + 1, 0);

  const effectsRef = useRef<Set<ReactiveEffect>>(new Set());
  const bindsRef = useRef<any>({});

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  useMemo(() => {
    const binds = setup(...args);

    Object.keys(binds).map(bindKey => {
      const bind = binds[bindKey];
      if (isRef(bind)) {
        const ref = computedTrace(bind as any, scheduler);
        bindsRef.current[bindKey] = ref;
        effectsRef.current.add(ref.effect);
      } else if (isReactive(bind)) {
        const ref = reactiveTrace(toRaw(bind), scheduler);
        bindsRef.current[bindKey] = ref.value;
        effectsRef.current.add(ref.effect);
      } else {
        bindsRef.current[bindKey] = bind;
      }
    });
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
