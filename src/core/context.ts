import React from 'react';

export const HuxContext = /*#__PURE__*/ React.createContext(null);

if (process.env.NODE_ENV !== 'production') {
  HuxContext.displayName = 'HuxContext';
}

export default HuxContext;
