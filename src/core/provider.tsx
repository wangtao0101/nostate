import React, { useMemo } from 'react';
import { HookuxContext } from './context';
import { HookuxMeta } from './createHookux';

export interface ProviderProps {
  children: React.ReactNode;
  store?: Record<string, any>;
}

export function Provider({ children, store }: ProviderProps) {
  const Context = HookuxContext;

  const contextValue = useMemo(() => {
    const innerStore: Record<string, any> = store || {};
    const scheduleMap: Record<any, Function[]> = {} as any;

    const isMounted = function(setup: any): boolean {
      return scheduleMap[setup] != null;
    };

    const mount = function(setup: any, bindRef: Record<string, any>) {
      // @ts-ignore
      const meta: HookuxMeta = setup.meta;

      let moduleState: Record<string, any> = innerStore[meta.module];
      if (moduleState == null) {
        moduleState = {} as Record<string, any>;
        innerStore[meta.module] = moduleState;
      }
      if (moduleState[meta.name] != null) {
        throw new Error(
          `[Hookux]: Should not mound hookux on same module: ${meta.module} and same name: ${meta.name}.`
        );
      }
      moduleState[meta.name] = {
        ...bindRef
      };
      scheduleMap[setup] = [];
    };

    const subscribe = function(setup: any, listener: () => void) {
      scheduleMap[setup].push(listener);
    };

    const getState = function(setup: Function) {
      // @ts-ignore
      const meta: HookuxMeta = setup.meta;
      return innerStore[meta.module][meta.name];
    };

    const schedule = function(setup: any) {
      scheduleMap[setup].map(lis => {
        lis();
      });
    };

    return {
      mount,
      isMounted,
      subscribe,
      schedule,
      getState,
      store: {}
    };
  }, []);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
