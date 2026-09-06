"use client";

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
import { motion } from "motion/react";

import TabItem from "./tab-item";
import TabContextProvider from "@/hoc/tab-context-provider";
import { useTabsKeyboard } from "@/hooks/use-tabs-keyboard";
import { cn } from "@/lib/utils";
import { useTabIndicatorDrag } from "./use-tab-indicator-drag";

interface ITabProps {
  minimal?: boolean;
  vertical?: boolean;
  currentTab?: number;
  setCurrentTab?: (value: number) => void;
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  tabId?: string;
  ariaLabel: string;
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
  ariaLabel,
}) => {
  const tabItems = useMemo(() => {
    return Children.toArray(children).filter(
      (child) => isValidElement(child) && child.type === TabItem,
    ) as ReactElement[];
  }, [children]);

  const handleTabChange = (value: number) => {
    setCurrentTab(value);
  };

  const handleKeyDown = useTabsKeyboard(
    tabItems.length,
    currentTab,
    handleTabChange,
  );

  const {
    tabListRef,
    scrollContainerRef,
    registerTab,
    onActivePointerDown,
    indicatorProps,
    isDragging,
    glow,
  } = useTabIndicatorDrag({
    currentTab,
    setCurrentTab: handleTabChange,
    vertical,
    tabCount: tabItems.length,
  });

  if (tabItems.length !== Children.count(children)) {
    throw new Error(
      "Tab component only accepts TabItem components as children",
    );
  }

  return (
    <TabContextProvider
      tabId={tabId}
      tabCount={tabItems.length}
      minimal={minimal}
      variant={variant}
      vertical={vertical}
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      registerTab={registerTab}
      onActivePointerDown={onActivePointerDown}
    >
      <div className={cn("relative max-w-full", isDragging && "z-20")}>
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={ariaLabel}
          data-dragging={isDragging ? "" : undefined}
          className={cn(
            "relative overflow-visible select-none",
            className,
            "overflow-visible",
          )}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-0 origin-center overflow-visible"
            {...indicatorProps}
          >
            <motion.div
              className="pointer-events-none absolute -inset-1 rounded-full bg-white/55 dark:bg-white/35"
              style={{ opacity: glow }}
            />
            <motion.div
              className="pointer-events-none absolute -inset-0.5 rounded-full bg-white/80 dark:bg-white/50"
              style={{ opacity: glow }}
            />
            <span className="bg-background ring-border absolute inset-0 rounded-full ring-1" />
          </motion.div>
          <div
            ref={scrollContainerRef}
            className={cn(
              "relative z-10 flex w-full max-w-full min-w-0 items-center gap-[inherit]",
              vertical
                ? "flex-col overflow-x-visible overflow-y-auto"
                : "snap-x snap-mandatory scrollbar-none overflow-x-auto overflow-y-visible overscroll-x-contain [&::-webkit-scrollbar]:hidden",
            )}
          >
            {tabItems.map((child, index) => {
              return cloneElement(child, {
                index,
              } as unknown as ReactElement);
            })}
          </div>
        </div>
      </div>
    </TabContextProvider>
  );
};

export default memo(Tab);
