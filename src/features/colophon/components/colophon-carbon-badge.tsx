"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

import { useThemeContext } from "@/hoc/theme-context-provider";
import { cn } from "@/lib/utils";

import { COLOPHON_CARBON } from "../data";

interface ColophonCarbonBadgeProps {
  co2Label: string;
  brandLabel: string;
  cleanerLabel: string;
}

export function ColophonCarbonBadge({
  co2Label,
  brandLabel,
  cleanerLabel,
}: ColophonCarbonBadgeProps) {
  const { isDark } = useThemeContext();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={COLOPHON_CARBON.carbonHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${co2Label}. ${cleanerLabel}. ${brandLabel}`}
      className={cn(
        "group focus-visible:ring-ring/40 mt-10 inline-flex max-w-full flex-col items-start gap-2 rounded-md outline-none focus-visible:ring-2",
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      whileInView={
        shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
      }
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.16, 0.8, 0.3, 1] }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
    >
      <span
        className="inline-flex overflow-hidden rounded-[0.35em] font-[system-ui,-apple-system,BlinkMacSystemFont,sans-serif] text-[15px] leading-[1.15] shadow-sm transition-shadow duration-300 group-hover:shadow-md"
        style={
          {
            "--wcb-ink": "#0e11a8",
            "--wcb-mint": "#00ffbc",
          } as CSSProperties
        }
      >
        <span className="inline-flex min-w-[8.2em] items-center justify-center rounded-l-[0.3em] border-[0.13em] border-r-0 border-(--wcb-mint) bg-white px-[0.5em] py-[0.3em] text-(--wcb-ink)">
          {co2Label}
        </span>
        <span
          className={cn(
            "relative inline-flex items-center justify-center overflow-hidden rounded-r-[0.3em] border-[0.13em] border-l-0 px-[0.5em] py-[0.3em] font-bold",
            isDark
              ? "border-(--wcb-mint) bg-(--wcb-mint) text-(--wcb-ink)"
              : "border-(--wcb-ink) bg-(--wcb-ink) text-white",
          )}
        >
          {!shouldReduceMotion ? (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent"
              animate={{ translateX: ["-100%", "200%"] }}
              transition={{
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 3.2,
              }}
            />
          ) : null}
          <span className="relative z-10">{brandLabel}</span>
        </span>
      </span>

      <span
        className={cn(
          "font-[system-ui,-apple-system,BlinkMacSystemFont,sans-serif] text-[15px] leading-[1.15]",
          isDark ? "text-white" : "text-[#0e11a8]",
        )}
      >
        {cleanerLabel}
      </span>
    </motion.a>
  );
}
