import { useMemo, useCallback, useRef, useLayoutEffect, useContext } from 'react';
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
import { HookuxMeta } from './createHookux';
import { HookuxContext } from './context';

type WrapTanceRef<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useHookux<RawBindings extends Record<string, any>, T extends any[]>(
  setup: (...args: T) => RawBindings,
  ...args: T
): WrapTanceRef<RawBindings> {
  const [, forceRender] = useReducer(s => s + 1, 0);
  const context = useContext(HookuxContext);

  // @ts-ignore
  const meta: HookuxMeta = setup.meta;

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

  const bindSetup = useCallback((sd: () => void) => {
    const binds = setup(...args);

    Object.keys(binds).map(bindKey => {
      const bind = binds[bindKey];
      if (isRef(bind)) {
        const ref = computedTrace(bind as any, sd);
        bindsRef.current[bindKey] = ref;
        effectsRef.current.add(ref.effect);
      } else if (isReactive(bind)) {
        const ref = reactiveTrace(toRaw(bind), sd);
        bindsRef.current[bindKey] = ref.value;
        effectsRef.current.add(ref.effect);
      } else {
        bindsRef.current[bindKey] = bind;
      }
    });
  }, []);

  useMemo(() => {
    if (meta && meta.global) {
      if (context.isMounted(setup)) {
        bindsRef.current = context.getState(setup);
      } else {
        bindSetup(() => context.schedule(setup));
        context.mount(setup, bindsRef.current);
      }
      context.subscribe(setup, scheduler);
    } else {
      bindSetup(scheduler);
      if (meta) {
        /* TODO: mount to ramdom position*/
        context.mount(setup, bindsRef.current);
      }
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
