"use client";

import type { FC, ReactNode } from "react";
import { createContext } from "react";

export interface IOSSafeAreaContextValue {
  topBarHeight: number;
  bottomHomeBarHeight: number;
  screenWidth: number;
  screenHeight: number;
  isDeviceMockup: boolean;
}

export const IOSSafeAreaContext = createContext<IOSSafeAreaContextValue>({
  topBarHeight: 38,
  bottomHomeBarHeight: 20,
  screenWidth: 300,
  screenHeight: 615,
  isDeviceMockup: true,
});

interface IOSSafeAreaProviderProps {
  children: ReactNode;
  value?: Partial<IOSSafeAreaContextValue>;
}

export const IOSSafeAreaProvider: FC<IOSSafeAreaProviderProps> = ({
  children,
  value,
}) => {
  const defaultValue: IOSSafeAreaContextValue = {
    topBarHeight: 38,
    bottomHomeBarHeight: 20,
    screenWidth: 300,
    screenHeight: 615,
    isDeviceMockup: true,
    ...value,
  };

  return (
    <IOSSafeAreaContext.Provider value={defaultValue}>
      {children}
    </IOSSafeAreaContext.Provider>
  );
};
