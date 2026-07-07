"use client";

import { useCallback, useEffect } from "react";
import {
  animate,
  useMotionValue,
  type MotionValue,
  type PanInfo,
} from "motion/react";

const CLOSE_OFFSET = 72;
const CLOSE_VELOCITY = 420;

export type SpotifyDragToCloseProps = {
  drag: "y";
  dragConstraints: { top: number; bottom: number };
  dragElastic: { top: number; bottom: number };
  dragMomentum: boolean;
  onDragEnd: (event: PointerEvent, info: PanInfo) => void;
};

export function useDragToClose(onClose: () => void, enabled: boolean) {
  const y = useMotionValue(0);

  const resetDrag = useCallback(() => {
    y.stop();
    y.set(0);
  }, [y]);

  useEffect(() => {
    resetDrag();
  }, [enabled, resetDrag]);

  const onDragEnd = (_event: PointerEvent, info: PanInfo) => {
    if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) {
      resetDrag();
      onClose();
      return;
    }

    void animate(y, 0, {
      type: "spring",
      stiffness: 520,
      damping: 38,
      mass: 0.65,
    });
  };

  return {
    y,
    resetDrag,
    dragProps: {
      drag: "y" as const,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0, bottom: 0.38 },
      dragMomentum: false,
      onDragEnd,
    } satisfies SpotifyDragToCloseProps,
  };
}

export type SpotifyDragMotionValue = MotionValue<number>;
