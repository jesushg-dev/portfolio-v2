import { createContext, useMemo, type ReactNode, useContext } from "react";

interface ITabContext {
  tabId: string;
  tabCount: number;
  minimal?: boolean;
  variant?: "primary" | "secondary";
  currentTab: number;
  setCurrentTab: (value: number) => void;
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
    }),
    [currentTab, minimal, setCurrentTab, tabId, tabCount, variant, vertical],
  );

  return (
    <TabContext.Provider value={contextValue}>{children}</TabContext.Provider>
  );
};

// create a usContext but validate if it is used inside a Tab
export const useTabContext = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};

export default TabContextProvider;
