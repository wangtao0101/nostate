import * as React from 'react';
import { useReducer, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { forwardComponent } from '../utils/forwardComponent';
import { ReactiveEffect, stop } from '../reactivity';
import { bindSetup } from './create';

interface ExtraOptions {
  forwardRef?: any;
}

interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
  <P extends TInjectedProps>(component: React.ComponentType<P>): React.ComponentClass<
    Omit<P, keyof TInjectedProps> & TNeedsProps
  > & { WrappedComponent: React.ComponentType<P> };
}

type getReturnType<P> = P extends () => any ? ReturnType<P> : P;
type MapToSetup<T> = { [P in keyof T]: getReturnType<T[P]> };

export function connect<P extends () => any, T extends Record<string, P>>(
  mapHookuxToProps: T,
  extraOptions: ExtraOptions = {}
): InferableComponentEnhancerWithProps<MapToSetup<T>, {}> {
  return function wrapWithConnect(WrappedComponent: any) {
    function ConnectFunction(props: any) {
      const { forwardedRef, ...rest } = props;

      const [, forceRender] = useReducer(s => s + 1, 0);

      const effectsRef = useRef<Array<Set<ReactiveEffect>>>([]);
      const bindsRef = useRef<any>({});

      const scheduler = useCallback(() => {
        forceRender();
      }, []);

      useMemo(() => {
        Object.keys(mapHookuxToProps).map(key => {
          const setup = mapHookuxToProps[key];
          const meta: any = (setup as any).meta;
          if (meta) {
            bindsRef.current[key] = meta.bindsMap;
            effectsRef.current.push(new Set());
            meta.tap(scheduler);
          } else {
            const { bindsMap, effectsSet } = bindSetup(setup as any, scheduler);
            bindsRef.current[key] = bindsMap;
            effectsRef.current.push(effectsSet);
          }
        });
      }, []);

      useLayoutEffect(() => {
        return () => {
          Object.keys(mapHookuxToProps).map((key, index) => {
            const setup = mapHookuxToProps[key];
            const meta: any = (setup as any).meta;
            if (meta) {
              meta.untap(scheduler);
            } else {
              const effects = effectsRef.current[index];
              for (const effect of effects) {
                stop(effect);
              }
            }
          });
        };
      }, []);

      return <WrappedComponent {...rest} {...bindsRef.current} ref={forwardedRef} />;
    }

    return forwardComponent(
      extraOptions.forwardRef,
      ConnectFunction,
      WrappedComponent,
      'HookuxConnect'
    );
  };
}
