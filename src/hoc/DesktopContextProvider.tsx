'use client';

import React, { useRef, createContext, useMemo } from 'react';
import type { FC } from 'react';

import useSize from '@/hooks/useSize';

export interface IDesktopContext {
  sizeScreen: { width: number; height: number };
}

// Create context with default theme
const DesktopContext = createContext<IDesktopContext>({
  sizeScreen: { width: 0, height: 0 },
});

// Provider component that wraps app and makes theme object available
interface IDesktopContextProviderProps {
  children: React.ReactNode;
}

const DesktopContextProvider: FC<IDesktopContextProviderProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const value = useMemo(() => ({ sizeScreen: size }), [size]);

  return (
    <DesktopContext.Provider value={value}>
      <div ref={ref} className="absolute top-0 left-0 w-full h-full flex flex-wrap">
        {children}
      </div>
    </DesktopContext.Provider>
  );
};

export const useDesktopContext = () => {
  const context = React.useContext(DesktopContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

export default DesktopContextProvider;
