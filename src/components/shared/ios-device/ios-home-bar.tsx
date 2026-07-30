"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface IOSHomeBarProps {
  className?: string;
  onSwipeUp?: () => void;
}

export const IOSHomeBar: FC<IOSHomeBarProps> = ({ className, onSwipeUp }) => {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-1 left-1/2 z-40 -translate-x-1/2 pb-1",
        className,
      )}
    >
      <motion.div
        whileTap={{ scaleX: 1.1, scaleY: 0.9 }}
        onClick={onSwipeUp}
        className="h-1 w-32 cursor-pointer rounded-full bg-white/40 transition-colors hover:bg-white/60 active:bg-white/80"
        aria-label="Home bar"
      />
    </div>
  );
};

export default IOSHomeBar;
