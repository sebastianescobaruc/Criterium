import React from 'react';

export const Ctx = React.createContext(null);
export const useApp = () => React.useContext(Ctx);
