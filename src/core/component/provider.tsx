import React, { useMemo } from 'react';
import { HookuxContext } from './context';
import { createStore } from '../createStore';

export interface ProviderProps {
  children: React.ReactNode;
  store: ReturnType<typeof createStore>;
}

export function Provider({ children, store }: ProviderProps) {
  const Context = HookuxContext;

  const contextValue = useMemo(() => {
    return {
      store
    };
  }, []);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
