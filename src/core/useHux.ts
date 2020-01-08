import { useMemo, useCallback } from 'react';
import { useReducer } from 'react';
import {
  isRef,
  computedTrace,
  isReactive,
  reactiveTrace,
  Ref,
  TraceRef,
  toRaw
} from '../reactivity';

type WrapTanceRef<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useHux<RawBindings extends Record<string, any>, T extends Record<string, any>>(
  setup: (args: T) => RawBindings,
  initValue: T
): WrapTanceRef<RawBindings> {
  const [, forceRender] = useReducer(s => s + 1, 0);

  const scheduler = useCallback(() => {
    forceRender();
  }, []);

  return useMemo(() => {
    const binds = setup(initValue);

    const newBinds: Record<string, any> = {};

    Object.keys(binds).map(bindKey => {
      const bind = binds[bindKey];
      if (isRef(bind)) {
        newBinds[bindKey] = computedTrace(bind as any, scheduler);
      } else if (isReactive(bind)) {
        newBinds[bindKey] = reactiveTrace(toRaw(bind), scheduler).value;
      } else {
        newBinds[bindKey] = bind;
      }
    });
    return newBinds;
  }, []) as any;
}
