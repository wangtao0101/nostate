import * as React from 'react';
import { useReducer, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { forwardComponent } from '../utils/forwardComponent';
import { ReactiveEffect, stop } from '../reactivity';
import { createBindsMap, SetupBinds } from './createSetup';

interface ExtraOptions {
  forwardRef?: any;
}

interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
  <P extends TInjectedProps>(component: React.ComponentType<P>): React.ComponentClass<
    Omit<P, keyof TInjectedProps> & TNeedsProps
  > & { WrappedComponent: React.ComponentType<P> };
}

export type getBindType<P, T extends Record<string, any>> = P extends SetupBinds<T> ? T : P;

type MapToSetup<T, Q> = { [P in keyof T]: getBindType<T[P], Q> };

export function connect<P extends Record<string, any>, T extends Record<string, SetupBinds<P>>>(
  mapSetupToProps: T,
  extraOptions: ExtraOptions = {}
): InferableComponentEnhancerWithProps<MapToSetup<T, P>, Record<string, never>> {
  return function wrapWithConnect(WrappedComponent: any) {
    function ConnectFunction(props: any) {
      const { forwardedRef, ...rest } = props;

      const [, forceRender] = useReducer((s) => s + 1, 0);

      const effectsRef = useRef<Array<Set<ReactiveEffect>>>([]);
      const bindsRef = useRef<any>({});

      const scheduler = useCallback(() => {
        forceRender();
      }, []);

      useMemo(() => {
        Object.keys(mapSetupToProps).map((key) => {
          const setupBinds = mapSetupToProps[key];

          const { bindsMap, effectsSet } = createBindsMap(setupBinds, scheduler);
          bindsRef.current[key] = bindsMap;
          effectsRef.current.push(effectsSet);
        });
      }, []);

      useLayoutEffect(() => {
        return () => {
          Object.keys(mapSetupToProps).map((key, index) => {
            const setup = mapSetupToProps[key];
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
      'NostateConnect'
    );
  };
}
