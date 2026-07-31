"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const revealEase = [0.16, 0.8, 0.3, 1] as const;
const revealViewport = { once: true, margin: "-80px" as const };

interface ProcessRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ProcessReveal({
  children,
  className,
  delay = 0,
}: ProcessRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{ duration: 0.65, ease: revealEase, delay }}
    >
      {children}
    </motion.div>
  );
}

interface ProcessRevealItemProps extends Omit<
  HTMLMotionProps<"li">,
  "children"
> {
  children: ReactNode;
  index?: number;
}

export function ProcessRevealItem({
  children,
  className,
  index = 0,
  ...props
}: ProcessRevealItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.li className={className} {...props}>
        {children}
      </motion.li>
    );
  }

  return (
    <motion.li
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{
        duration: 0.55,
        ease: revealEase,
        delay: index * 0.08,
      }}
      {...props}
    >
      {children}
    </motion.li>
  );
}

interface ProcessRevealStaggerItemProps extends Omit<
  HTMLMotionProps<"div">,
  "children"
> {
  children: ReactNode;
  index?: number;
}

export function ProcessRevealStaggerItem({
  children,
  className,
  index = 0,
  ...props
}: ProcessRevealStaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div className={className} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{
        duration: 0.55,
        ease: revealEase,
        delay: index * 0.08,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
