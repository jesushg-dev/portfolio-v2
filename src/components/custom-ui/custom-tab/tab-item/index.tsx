"use client";

import { useCallback, type FC } from "react";
import type { IconComponent } from "@/lib/icons/icon-registry";
import type { IconType } from "react-icons/lib";
import { useTabContext } from "@/hoc/tab-context-provider";
import { cn } from "@/lib/utils";

export interface TabItemProps {
  index?: number;
  icon: IconComponent | IconType;
  title: string;
  description: string;
  /** A stable results panel shared by filter tabs, when content is reused. */
  panelId?: string;
}

const TabItem: FC<TabItemProps> = ({
  index = -1,
  icon: Icon,
  title,
  description,
  panelId,
}) => {
  const {
    currentTab,
    setCurrentTab,
    minimal,
    tabId,
    registerTab,
    onActivePointerDown,
  } = useTabContext();

  const isActive = currentTab === index;
  const tabPanelId = panelId ?? `${tabId}-panel-${index}`;
  const tabButtonId = `${tabId}-tab-${index}`;

  const textClassName = isActive
    ? "text-foreground font-semibold"
    : "text-foreground";

  const setTabNode = useCallback(
    (node: HTMLDivElement | null) => {
      registerTab(index, node);
    },
    [index, registerTab],
  );

  return (
    <div
      ref={setTabNode}
      className={cn(
        "relative isolate z-10 shrink-0 snap-start",
        minimal && "min-w-18 sm:min-w-0",
      )}
    >
      <button
        type="button"
        role="tab"
        id={tabButtonId}
        {...(panelId || tabId ? { "aria-controls": tabPanelId } : {})}
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        title={title}
        onPointerDown={isActive ? onActivePointerDown : undefined}
        onClick={() => {
          if (isActive) return;
          setCurrentTab(index);
        }}
        className={cn(
          "group relative z-10 flex shrink-0 cursor-pointer items-center rounded-full transition-all",
          minimal
            ? "min-h-11 w-full min-w-11 flex-col justify-center gap-0.5 px-2.5 py-1.5 text-center sm:flex-row sm:gap-0 sm:px-5 sm:py-2 sm:text-left"
            : "min-h-11 w-full px-4 py-2 text-left sm:p-4 sm:px-5 md:p-5",
          isActive
            ? "text-foreground touch-none"
            : "hover:bg-accent/40 touch-manipulation",
        )}
      >
        <span
          className={cn(
            "flex items-center transition-all",
            minimal && "flex-col sm:flex-row",
            textClassName,
          )}
        >
          <Icon
            className={cn(
              "shrink-0",
              minimal ? "size-3.5 sm:size-4.5" : "mt-2 size-6 md:size-7",
            )}
            width={16}
            height={16}
            aria-hidden
          />
          <span className={cn(minimal ? "ml-0 sm:ml-3 sm:grow" : "ml-6 grow")}>
            <span
              className={cn(
                "block whitespace-nowrap",
                minimal
                  ? "text-[0.6875rem] leading-tight sm:text-sm"
                  : "text-lg font-semibold",
              )}
            >
              {title}
            </span>
            {minimal ? null : (
              <span className="text-muted-foreground mt-1 hidden lg:block">
                {description}
              </span>
            )}
          </span>
        </span>
      </button>
    </div>
  );
};

export default TabItem;
