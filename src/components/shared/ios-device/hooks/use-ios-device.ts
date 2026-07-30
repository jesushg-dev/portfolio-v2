"use client";

import { useCallback, useContext } from "react";
import {
  IOSSafeAreaContext,
  type IOSSafeAreaContextValue,
} from "../ios-safe-area-context";

export interface ScrollIntoContainerOptions {
  block?: "center" | "start" | "end";
  behavior?: ScrollBehavior;
}

export interface UseIOSDeviceResult extends IOSSafeAreaContextValue {
  /**
   * Automatically finds the nearest scroll container inside the iOS device
   * and scrolls the target element into view without bubbling to parent containers.
   */
  scrollToElement: (
    element: HTMLElement | null,
    options?: ScrollIntoContainerOptions,
  ) => void;
}

function internalScrollToElement(
  element: HTMLElement | null,
  options: ScrollIntoContainerOptions = {},
): void {
  if (!element) return;

  const container = element.closest<HTMLElement>(
    ".overflow-y-auto, .overflow-auto, [data-ios-scroll-container]",
  );

  if (!container) return;

  const { block = "center", behavior = "smooth" } = options;
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  let targetTop = container.scrollTop;

  if (block === "center") {
    targetTop =
      container.scrollTop +
      (elementRect.top - containerRect.top) -
      containerRect.height / 2 +
      elementRect.height / 2;
  } else if (block === "start") {
    targetTop = container.scrollTop + (elementRect.top - containerRect.top);
  } else if (block === "end") {
    targetTop =
      container.scrollTop + (elementRect.bottom - containerRect.bottom);
  }

  const safeTop = Math.max(0, targetTop);

  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: safeTop, behavior });
  } else {
    container.scrollTop = safeTop;
  }
}

export function useIOSDevice(): UseIOSDeviceResult {
  const context = useContext(IOSSafeAreaContext);

  const scrollToElement = useCallback(
    (element: HTMLElement | null, options?: ScrollIntoContainerOptions) => {
      internalScrollToElement(element, options);
    },
    [],
  );

  const baseValues = context ?? {
    topBarHeight: 38,
    bottomHomeBarHeight: 20,
    screenWidth: 300,
    screenHeight: 615,
    isDeviceMockup: false,
  };

  return {
    ...baseValues,
    scrollToElement,
  };
}
