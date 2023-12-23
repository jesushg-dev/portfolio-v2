import React, { FC, createContext, useMemo, memo, useState, useEffect } from 'react';

import { AnimatePresence } from 'framer-motion';
import TabItem from './TabItem';

//create a context for the tab
interface ITabContext {
  minimal?: boolean;
  currentTab: number;
  variant?: 'primary' | 'secondary';
  setCurrentTab: (value: number) => void;
}

const TabContext = createContext<ITabContext | undefined>(undefined);

interface ITabProps {
  minimal?: boolean;
  vertical?: boolean;
  currentTab?: number;
  setCurrentTab?: (value: number) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const Tab: FC<ITabProps> = ({ children, minimal = false, currentTab = 0, setCurrentTab = () => {}, className, variant = 'primary' }) => {
  const [crtTab, setCrtTab] = useState(currentTab);

  // Check that every child element is a TabItem
  const tabItems = useMemo(() => {
    return React.Children.toArray(children).filter(
      (child) => React.isValidElement(child) && child.type === TabItem
    ) as React.ReactElement[];
  }, [children]);

  if (tabItems.length !== React.Children.count(children)) {
    throw new Error('Tab component only accepts TabItem components as children');
  }

  const handleTabChange = (value: number) => {
    setCrtTab(value);
    setCurrentTab(value);
  };

  useEffect(() => {
    setCrtTab(currentTab);
  }, [currentTab]);

  return (
    <TabContext.Provider value={{ currentTab: crtTab, setCurrentTab: handleTabChange, minimal, variant }}>
      <nav className={className}>
        <AnimatePresence mode="wait">
          {tabItems.map((child, index) => {
            return React.cloneElement(child, { index });
          })}
        </AnimatePresence>
      </nav>
    </TabContext.Provider>
  );
};

//create a usContext but validate if it is used inside a Tab
const useTabContext = () => {
  const context = React.useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export { TabItem, useTabContext };
export default memo(Tab);
