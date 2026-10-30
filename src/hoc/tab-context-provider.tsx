"use client";

import {
  createContext,
  useMemo,
  type ReactNode,
  useContext,
  type PointerEvent,
} from "react";

interface ITabContext {
  tabId: string;
  tabCount: number;
  vertical: boolean;
  currentTab: number;
  setCurrentTab: (value: number) => void;
  registerTab: (index: number, node: HTMLElement | null) => void;
  onActivePointerDown: (event: PointerEvent<HTMLElement>) => void;
}

const TabContext = createContext<ITabContext | undefined>(undefined);

interface ITabContextProviderProps {
  tabId: string;
  tabCount: number;
  children: ReactNode;
  vertical: boolean;
  currentTab: number;
  setCurrentTab: (value: number) => void;
  registerTab: (index: number, node: HTMLElement | null) => void;
  onActivePointerDown: (event: PointerEvent<HTMLElement>) => void;
}

const TabContextProvider = ({
  tabId,
  tabCount,
  children,
  currentTab,
  vertical,
  setCurrentTab,
  registerTab,
  onActivePointerDown,
}: ITabContextProviderProps) => {
  const contextValue = useMemo(
    () => ({
      vertical,
      currentTab,
      setCurrentTab,
      tabId,
      tabCount,
      registerTab,
      onActivePointerDown,
    }),
    [
      currentTab,
      onActivePointerDown,
      registerTab,
      setCurrentTab,
      tabId,
      tabCount,
      vertical,
    ],
  );

  return (
    <TabContext.Provider value={contextValue}>{children}</TabContext.Provider>
  );
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};

export default TabContextProvider;
