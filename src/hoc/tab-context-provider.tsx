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
  minimal?: boolean;
  variant?: "primary" | "secondary";
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
  minimal: boolean;
  children: ReactNode;
  vertical: boolean;
  variant: "primary" | "secondary";
  currentTab: number;
  setCurrentTab: (value: number) => void;
  registerTab: (index: number, node: HTMLElement | null) => void;
  onActivePointerDown: (event: PointerEvent<HTMLElement>) => void;
}

const TabContextProvider = ({
  tabId,
  tabCount,
  variant,
  minimal,
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
      minimal,
      variant,
      tabId,
      tabCount,
      registerTab,
      onActivePointerDown,
    }),
    [
      currentTab,
      minimal,
      onActivePointerDown,
      registerTab,
      setCurrentTab,
      tabId,
      tabCount,
      variant,
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
