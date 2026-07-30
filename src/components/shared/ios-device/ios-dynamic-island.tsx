"use client";

import type { FC } from "react";
import { motion } from "motion/react";

import {
  useIOSDynamicIsland,
  type DynamicIslandState,
} from "./hooks/use-ios-dynamic-island";
import { cn } from "@/lib/utils";

interface IOSDynamicIslandProps {
  className?: string;
  overrideState?: DynamicIslandState;
}

export const IOSDynamicIsland: FC<IOSDynamicIslandProps> = ({
  className,
  overrideState,
}) => {
  const { islandState: contextState, content } = useIOSDynamicIsland();
  const state = overrideState ?? contextState;

  if (state === "hidden") {
    return null;
  }

  const isExpanded = state === "expanded";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={cn(
        "pointer-events-auto absolute top-1.5 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between overflow-hidden rounded-full bg-black text-white shadow-lg",
        state === "compact" && "h-5.5 w-18 px-2.5",
        state === "minimal" && "h-5.5 w-10 px-2",
        isExpanded && "h-14 w-68 rounded-3xl p-3.5",
        className,
      )}
      aria-label="Dynamic Island"
    >
      {isExpanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="size-full"
        >
          {content.expandedContent ?? (
            <div className="flex size-full items-center justify-between text-xs text-white/80">
              {content.leading}
              {content.trailing}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-1">{content.leading}</div>
          <div className="flex items-center gap-1">{content.trailing}</div>
        </>
      )}
    </motion.div>
  );
};

export default IOSDynamicIsland;
