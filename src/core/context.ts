import React from 'react';

export const HookuxContext = /*#__PURE__*/ React.createContext(null);

if (process.env.NODE_ENV !== 'production') {
  HookuxContext.displayName = 'HookuxContext';
}

export default HookuxContext;
