import React from 'react';

export interface HookuxContextProps {
  store: Record<string, any>;
  mount: (setup: any, bindRef: Record<string, any>) => void;
  isMounted: (setup: any) => boolean;
  schedule: (setup: any) => void;
  getState: (setup: Function) => any;
  subscribe: (setup: Function, listener: () => void) => void;
}

export const HookuxContext = /*#__PURE__*/ React.createContext<HookuxContextProps>(null as any);

if (process.env.NODE_ENV !== 'production') {
  HookuxContext.displayName = 'HookuxContext';
}
