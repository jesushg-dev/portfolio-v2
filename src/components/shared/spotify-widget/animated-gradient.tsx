"use client";

import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";

import { buildSpotifyGradient } from "./use-album-color";

interface AnimatedGradientProps {
  accentColor: string;
  /** Skip crossfade — use during layout morphs for better performance */
  instant?: boolean;
}

const GRADIENT_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as const;

const AnimatedGradient: FC<AnimatedGradientProps> = ({
  accentColor,
  instant = false,
}) => {
  if (instant) {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{ background: buildSpotifyGradient(accentColor) }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 20% 0%, ${accentColor}88 0%, transparent 55%)`,
          }}
        />
      </>
    );
  }

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={accentColor}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={GRADIENT_TRANSITION}
        className="absolute inset-0"
        style={{ background: buildSpotifyGradient(accentColor) }}
      />
      <motion.div
        key={`${accentColor}-glow`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        transition={GRADIENT_TRANSITION}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 20% 0%, ${accentColor}88 0%, transparent 55%)`,
        }}
      />
    </AnimatePresence>
  );
};

export default AnimatedGradient;
