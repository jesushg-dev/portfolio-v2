"use client";

import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  buildSpotifyAccentOverlay,
  SPOTIFY_PLAYER_BASE,
} from "../hooks/use-album-color";

interface AnimatedGradientProps {
  accentColor: string;
  /** Skip crossfade — use during layout morphs for better performance */
  instant?: boolean;
}

const COLOR_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;

const AnimatedGradient: FC<AnimatedGradientProps> = ({
  accentColor,
  instant = false,
}) => {
  if (instant) {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: SPOTIFY_PLAYER_BASE }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: buildSpotifyAccentOverlay(accentColor) }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: SPOTIFY_PLAYER_BASE }}
      />
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={accentColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={COLOR_TRANSITION}
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: buildSpotifyAccentOverlay(accentColor) }}
        />
      </AnimatePresence>
    </>
  );
};

export default AnimatedGradient;
