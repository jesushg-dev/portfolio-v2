import {
  useMemo,
  memo,
  type ReactNode,
  Children,
  isValidElement,
  type ReactElement,
  cloneElement,
} from "react";
import type { FC } from "react";
import { AnimatePresence } from "motion/react";

import TabItem from "./tab-item";
import TabContextProvider from "@/hoc/tab-context-provider";

interface ITabProps {
  minimal?: boolean;
  vertical?: boolean;
  currentTab?: number;
  setCurrentTab?: (value: number) => void;
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  tabId?: string;
}

const Tab: FC<ITabProps> = ({
  children,
  setCurrentTab = () => {
    // Default function does nothing
  },
  className,
  tabId = "",
  minimal = false,
  currentTab = 0,
  vertical = false,
  variant = "primary",
}) => {
  // Check that every child element is a TabItem
  const tabItems = useMemo(() => {
    return Children.toArray(children).filter(
      (child) => isValidElement(child) && child.type === TabItem,
    ) as ReactElement[];
  }, [children]);

  const handleTabChange = (value: number) => {
    setCurrentTab(value);
  };

  if (tabItems.length !== Children.count(children)) {
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
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
    >
      <nav className={className}>
        <AnimatePresence>
          {tabItems.map((child, index) => {
            return cloneElement(child, {
              index,
            } as unknown as ReactElement);
          })}
        </AnimatePresence>
      </nav>
    </TabContextProvider>
  );
};

export default memo(Tab);
