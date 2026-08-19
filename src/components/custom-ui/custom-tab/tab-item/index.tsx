import { useMemo } from "react";
import type { FC } from "react";
import type { IconType } from "react-icons/lib";
import { motion } from "motion/react";
import { useTabContext } from "@/hoc/tab-context-provider";
import { cn } from "@/lib/utils";

export interface TabItemProps {
  index?: number;
  icon: IconType;
  title: string;
  description: string;
}

const variants = {
  active: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  inactive: {
    opacity: 0.75,
    transition: {
      duration: 0.3,
    },
  },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const TabItem: FC<TabItemProps> = ({
  index = -1,
  icon: Icon,
  title,
  description,
}) => {
  const { currentTab, setCurrentTab, minimal, tabId } = useTabContext();

  const isActive = currentTab === index;
  const tabPanelId = `${tabId}-panel-${index}`;
  const tabButtonId = `${tabId}-tab-${index}`;

  const textClassName = useMemo(() => {
    if (isActive) {
      return "text-primary-foreground font-semibold";
    }
    return "text-muted-foreground group-hover:text-foreground";
  }, [isActive]);

  return (
    <div className="relative isolate">
      {isActive && (
        <motion.div
          layoutId={`background-tab${tabId}`}
          className={cn(
            "bg-primary absolute inset-0 z-0 rounded-full shadow-md",
          )}
          aria-hidden
        />
      )}
      <motion.button
        type="button"
        role="tab"
        id={tabButtonId}
        {...(tabId ? { "aria-controls": tabPanelId } : {})}
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        title={title}
        animate={minimal ? "active" : isActive ? "active" : "inactive"}
        variants={variants}
        initial="inactive"
        whileHover="hover"
        onClick={() => setCurrentTab(index)}
        className={cn(
          "group relative z-10 flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center rounded-full px-4 py-2 text-left transition-all sm:px-5",
          minimal ? "w-auto" : "w-full sm:p-4 md:p-5",
          !isActive && "hover:bg-accent/40",
        )}
      >
        <span className={cn("flex items-center transition-all", textClassName)}>
          <Icon
            className={cn(
              "shrink-0",
              minimal ? "size-4 sm:size-[1.125rem]" : "mt-2 size-6 md:size-7",
            )}
            width={16}
            height={16}
            aria-hidden
          />
          <span className={cn("grow", minimal ? "ml-2.5 sm:ml-3" : "ml-6")}>
            <span
              className={cn(
                "block whitespace-nowrap",
                minimal ? "text-sm" : "text-lg font-semibold",
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
      </motion.button>
    </div>
  );
};

export default TabItem;
