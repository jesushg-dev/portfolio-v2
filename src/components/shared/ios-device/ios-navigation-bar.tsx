"use client";

import type { FC, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useIOSNavigation } from "./hooks/use-ios-navigation";
import { cn } from "@/lib/utils";

interface IOSNavigationBarProps {
  className?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  title?: string;
}

export const IOSNavigationBar: FC<IOSNavigationBarProps> = ({
  className,
  headerLeft,
  headerRight,
  title: overrideTitle,
}) => {
  const { activeRoute, previousRoute, canGoBack, pop } = useIOSNavigation();

  const title = overrideTitle ?? activeRoute?.title ?? "";
  const backLabel = previousRoute?.title ?? "Atrás";

  return (
    <header
      className={cn(
        "relative z-20 shrink-0 px-3.5 pt-9.5 pb-1 text-white",
        className,
      )}
    >
      <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2">
        <div className="flex items-center">
          {headerLeft ??
            (canGoBack ? (
              <button
                type="button"
                onClick={pop}
                className="flex items-center text-xs font-medium text-white/90 transition-opacity active:opacity-60"
                aria-label={`Volver a ${backLabel}`}
              >
                <ChevronLeft className="size-5 shrink-0" strokeWidth={2.5} />
              </button>
            ) : (
              <span className="size-7" aria-hidden />
            ))}
        </div>

        <div className="relative overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="truncate text-[0.70rem] font-semibold text-white/90"
            >
              {title}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end">{headerRight}</div>
      </div>
    </header>
  );
};

export default IOSNavigationBar;
