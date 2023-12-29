import React, { createContext, useMemo } from 'react';

interface ITabContext {
  tabId: string;
  minimal?: boolean;
  variant?: 'primary' | 'secondary';
  currentTab: number;
  setCurrentTab: (value: number) => void;
}

const TabContext = createContext<ITabContext | undefined>(undefined);

interface ITabContextProviderProps {
  tabId: string;
  minimal: boolean;
  children: React.ReactNode;
  vertical: boolean;
  variant: 'primary' | 'secondary';
  currentTab: number;
  setCurrentTab: (value: number) => void;
}

const TabContextProvider = ({
  tabId,
  variant,
  minimal,
  children,
  currentTab,
  vertical,
  setCurrentTab,
}: ITabContextProviderProps) => {
  const contextValue = useMemo(
    () => ({ vertical, currentTab, setCurrentTab, minimal, variant, tabId }),
    [currentTab, minimal, setCurrentTab, tabId, variant, vertical]
  );

  return <TabContext.Provider value={contextValue}>{children}</TabContext.Provider>;
};

// create a usContext but validate if it is used inside a Tab
export const useTabContext = () => {
  const context = React.useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export default TabContextProvider;
