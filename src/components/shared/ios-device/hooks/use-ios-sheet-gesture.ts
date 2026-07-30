"use client";

import { useCallback } from "react";
import {
  useMotionValue,
  useSpring,
  type MotionValue,
  type PanInfo,
} from "motion/react";

import { useCallbackRef } from "@/hooks/use-callback-ref";

export interface IOSSheetGestureConfig {
  onClose: () => void;
  thresholdPx?: number;
  resistance?: number;
}

export interface IOSSheetGestureResult {
  dragY: MotionValue<number>;
  dragProps: {
    drag: "y";
    dragConstraints: { top: number; bottom: number };
    dragElastic: number;
    onDragEnd: (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => void;
  };
}

export function useIOSSheetGesture({
  onClose,
  thresholdPx = 90,
  resistance = 0.2,
}: IOSSheetGestureConfig): IOSSheetGestureResult {
  const rawY = useMotionValue(0);
  const dragY = useSpring(rawY, { stiffness: 400, damping: 35 });
  const handleClose = useCallbackRef(onClose);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.y;
      const velocity = info.velocity.y;

      if (offset > thresholdPx || velocity > 400) {
        handleClose();
      } else {
        rawY.set(0);
      }
    },
    [rawY, thresholdPx, handleClose],
  );

  return {
    dragY,
    dragProps: {
      drag: "y",
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: resistance,
      onDragEnd: handleDragEnd,
    },
  };
}
