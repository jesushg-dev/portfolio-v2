"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface IOSHomeBarProps {
  className?: string;
  onSwipeUp?: () => void;
  label?: string;
  decorative?: boolean;
}

export const IOSHomeBar: FC<IOSHomeBarProps> = ({
  className,
  onSwipeUp,
  label,
  decorative = false,
}) => {
  if (decorative) return <span aria-hidden="true" className={className} />;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-1 left-1/2 z-40 -translate-x-1/2 pb-1",
        className,
      )}
    >
      {onSwipeUp ? (
        <motion.button
          type="button"
          whileTap={{ scaleX: 1.1, scaleY: 0.9 }}
          onClick={onSwipeUp}
          aria-label={label ?? "Home"}
          className="relative block h-4 w-32 cursor-pointer rounded-full after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-white/60 hover:after:bg-white"
        />
      ) : (
        <div aria-hidden="true" className="h-1 w-32 rounded-full bg-white/40" />
      )}
    </div>
  );
};

export default IOSHomeBar;
