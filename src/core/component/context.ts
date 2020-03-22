import React from 'react';
import { createStore } from '../createStore';

export interface HookuxContextProps {
  store: ReturnType<typeof createStore>;
}

export const HookuxContext = /*#__PURE__*/ React.createContext<HookuxContextProps>(null as any);

if (process.env.NODE_ENV !== 'production') {
  HookuxContext.displayName = 'HookuxContext';
}
