import { useMemo } from "react";
import type { FC } from "react";
import type { IconType } from "react-icons/lib";
import { motion } from "framer-motion";

import { useTabContext } from "@/hoc/TabContextProvider";

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
    opacity: 0.7,
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
  const { currentTab, setCurrentTab, minimal, variant, tabId } =
    useTabContext();

  const isActive = currentTab === index;
  // determine text based if it is active and which variant is used
  const textClassName = useMemo(() => {
    if (isActive) {
      return variant === "primary"
        ? "text-secondaryText-50"
        : "text-primary-500";
    }
    return variant === "primary"
      ? "text-primaryText-400"
      : "text-primaryText-800";
  }, [isActive, variant]);

  return (
    <div className="relative" role="tab">
      {isActive && (
        <motion.div
          layoutId={`background-tab${tabId}`}
          className={`absolute inset-0 -z-10 rounded-xl shadow-md ${
            variant === "primary" ? "bg-primary-600" : "bg-background-100"
          }`}
        />
      )}
      <motion.button
        type="button"
        title={title}
        id={`tab-${index}`}
        animate={isActive ? "active" : "inactive"}
        variants={variants}
        initial="inactive"
        whileHover="hover"
        onClick={() => setCurrentTab(index)}
        className={`w-full rounded-xl p-4 text-left md:p-5 ${isActive ? "" : "hover:bg-background-800/30"}`}
      >
        <span className={`flex items-center transition-all ${textClassName}`}>
          <Icon
            className={` ${minimal ? "mt-0" : "mt-2 h-6  w-6 flex-shrink-0 md:h-7 md:w-7"}`}
            width={16}
            height={16}
          />
          <span className="ml-6 grow">
            <span
              className={`block whitespace-nowrap font-semibold ${minimal ? "" : "text-lg"}  `}
            >
              {title}
            </span>
            {minimal ? null : (
              <span className="mt-1 hidden text-primaryText-800 lg:block">
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
