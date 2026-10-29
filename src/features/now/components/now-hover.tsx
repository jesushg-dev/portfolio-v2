"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface NowHoverProps {
  children: ReactNode;
  className?: string;
  cover?: boolean;
}
export function NowHover({
  children,
  className,
  cover = false,
}: NowHoverProps) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={
        reducedMotion
          ? undefined
          : cover
            ? { rotate: -3, scale: 1.035 }
            : { y: "-0.25rem" }
      }
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
