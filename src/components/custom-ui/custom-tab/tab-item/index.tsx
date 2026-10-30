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
  /** A stable results panel shared by filter tabs, when content is reused. */
  panelId?: string;
}

const TabItem: FC<TabItemProps> = ({
  index = -1,
  icon: Icon,
  title,
  panelId,
}) => {
  const { currentTab, setCurrentTab, tabId, registerTab, onActivePointerDown } =
    useTabContext();

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
      className="relative isolate z-10 min-w-18 shrink-0 snap-start sm:min-w-0"
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
          "group relative z-10 flex min-h-11 w-full min-w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 text-center transition-all sm:flex-row sm:gap-0 sm:px-5 sm:py-2 sm:text-left",
          isActive
            ? "text-foreground touch-none"
            : "hover:bg-accent/40 touch-manipulation",
        )}
      >
        <span
          className={cn(
            "flex flex-col items-center transition-all sm:flex-row",
            textClassName,
          )}
        >
          <Icon
            className="size-3.5 shrink-0 sm:size-4.5"
            width={16}
            height={16}
            aria-hidden
          />
          <span className="ml-0 sm:ml-3 sm:grow">
            <span className="block text-[0.6875rem] leading-tight whitespace-nowrap sm:text-sm">
              {title}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
};

export default TabItem;
