import React, { useMemo, memo, useState, useEffect } from "react";
import type { FC } from "react";
import { AnimatePresence } from "framer-motion";

import TabContextProvider from "@/hoc/TabContextProvider";

import TabItem from "./TabItem";

interface ITabProps {
  minimal?: boolean;
  vertical?: boolean;
  currentTab?: number;
  setCurrentTab?: (value: number) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  tabId?: string;
}

const Tab: FC<ITabProps> = ({
  children,
  setCurrentTab = () => {},
  className,
  tabId = "",
  minimal = false,
  currentTab = 0,
  vertical = false,
  variant = "primary",
}) => {
  const [crtTab, setCrtTab] = useState(currentTab);
  // Check that every child element is a TabItem
  const tabItems = useMemo(() => {
    return React.Children.toArray(children).filter(
      (child) => React.isValidElement(child) && child.type === TabItem,
    ) as React.ReactElement[];
  }, [children]);

  const handleTabChange = (value: number) => {
    setCrtTab(value);
    setCurrentTab(value);
  };

  useEffect(() => {
    setCrtTab(currentTab);
  }, [currentTab]);

  if (tabItems.length !== React.Children.count(children)) {
    throw new Error(
      "Tab component only accepts TabItem components as children",
    );
  }

  return (
    <TabContextProvider
      tabId={tabId}
      minimal={minimal}
      variant={variant}
      vertical={vertical}
      currentTab={crtTab}
      setCurrentTab={handleTabChange}
    >
      <nav className={className}>
        <AnimatePresence>
          {tabItems.map((child, index) => {
            return React.cloneElement(child, { index });
          })}
        </AnimatePresence>
      </nav>
    </TabContextProvider>
  );
};

export default memo(Tab);
