"use client";

import {
  useMemo,
  useEffect,
  useState,
  useRef,
  memo,
  type ReactNode,
  Children,
  isValidElement,
  type ReactElement,
  cloneElement,
} from "react";
import type { FC } from "react";
import { motion } from "motion/react";

import TabItem from "./tab-item";
import TabContextProvider from "@/hoc/tab-context-provider";
import { useTabsKeyboard } from "@/hooks/use-tabs-keyboard";
import { cn } from "@/lib/utils";
import { useTabIndicatorDrag } from "./use-tab-indicator-drag";

interface ITabProps {
  vertical?: boolean;
  currentTab?: number;
  setCurrentTab?: (value: number) => void;
  children?: ReactNode;
  className?: string;
  tabId?: string;
  ariaLabel: string;
}

const Tab: FC<ITabProps> = ({
  children,
  setCurrentTab = () => {
    // Default function does nothing
  },
  className,
  tabId = "",
  currentTab = 0,
  vertical = false,
  ariaLabel,
}) => {
  const tabItems = useMemo(() => {
    return Children.toArray(children).filter(
      (child) => isValidElement(child) && child.type === TabItem,
    ) as ReactElement[];
  }, [children]);

  const handleTabChange = (value: number) => {
    setCurrentTab(value);
  };

  const handleKeyDown = useTabsKeyboard(
    tabItems.length,
    currentTab,
    handleTabChange,
  );

  const {
    tabListRef,
    scrollContainerRef,
    registerTab,
    onActivePointerDown,
    indicatorProps,
    isDragging,
    glow,
  } = useTabIndicatorDrag({
    currentTab,
    setCurrentTab: handleTabChange,
    vertical,
    tabCount: tabItems.length,
  });

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const edgeScrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (vertical) return;
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const updateScrollEdges = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      const maxScroll = scrollWidth - clientWidth;
      // Use 2px threshold to absorb subpixel rounding
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < maxScroll - 2);
    };

    updateScrollEdges();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollEdges)
        : null;

    resizeObserver?.observe(scroller);
    scroller.addEventListener("scroll", updateScrollEdges, { passive: true });
    window.addEventListener("resize", updateScrollEdges);

    return () => {
      resizeObserver?.disconnect();
      scroller.removeEventListener("scroll", updateScrollEdges);
      window.removeEventListener("resize", updateScrollEdges);
    };
  }, [scrollContainerRef, tabItems.length, vertical]);

  // Velocity-driven scroll: scroll follows the direction and speed the cursor
  // moves toward the overflow edge — like a mobile swipe translating to content movement.
  // NOTE: Listeners are on tabListRef (not scrollContainerRef) because mask-image on
  // the scroll container causes transparent edge zones to fail pointer hit-testing in
  // WebKit/Chromium — the exact zones we need to detect.
  useEffect(() => {
    if (vertical) return;
    const listEl = tabListRef.current;
    const scroller = scrollContainerRef.current;
    if (!listEl || !scroller) return;

    // Physics state
    let velocity = 0;
    let prevClientX: number | null = null;
    let prevTimestamp: number | null = null;
    const FRICTION = 0.82;
    const VELOCITY_SCALE = 0.6;
    const MAX_SPEED = 14;
    const STOP_THRESHOLD = 0.3;

    const stopRaf = () => {
      if (edgeScrollRafRef.current !== null) {
        cancelAnimationFrame(edgeScrollRafRef.current);
        edgeScrollRafRef.current = null;
      }
    };

    const startRaf = () => {
      if (edgeScrollRafRef.current !== null) return;
      const tick = () => {
        if (Math.abs(velocity) < STOP_THRESHOLD) {
          velocity = 0;
          edgeScrollRafRef.current = null;
          return;
        }
        scroller.scrollLeft += velocity;
        velocity *= FRICTION;
        edgeScrollRafRef.current = requestAnimationFrame(tick);
      };
      edgeScrollRafRef.current = requestAnimationFrame(tick);
    };

    const handlePointerLeave = () => {
      prevClientX = null;
      prevTimestamp = null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      // First event — just snapshot, no delta yet
      if (prevClientX === null || prevTimestamp === null) {
        prevClientX = e.clientX;
        prevTimestamp = e.timeStamp;
        return;
      }

      const dt = e.timeStamp - prevTimestamp;
      if (dt <= 0) return;

      const dx = e.clientX - prevClientX;
      prevClientX = e.clientX;
      prevTimestamp = e.timeStamp;

      const pointerVelocity = (dx / dt) * 16.7;

      // Use scroller rect for zone calculations (scroll state lives there)
      const rect = scroller.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const containerWidth = rect.width;
      const edgeZone = containerWidth * 0.35;

      const hasLeftOverflow = scroller.scrollLeft > 2;
      const hasRightOverflow =
        scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 2;

      const inRightZone = cursorX > containerWidth - edgeZone;
      const inLeftZone = cursorX < edgeZone;
      const movingRight = pointerVelocity > 0;
      const movingLeft = pointerVelocity < 0;

      if (inRightZone && movingRight && hasRightOverflow) {
        const strength = (cursorX - (containerWidth - edgeZone)) / edgeZone;
        velocity = Math.min(
          MAX_SPEED,
          velocity + pointerVelocity * VELOCITY_SCALE * (0.4 + strength * 0.6),
        );
        startRaf();
      } else if (inLeftZone && movingLeft && hasLeftOverflow) {
        const strength = 1 - cursorX / edgeZone;
        velocity = Math.max(
          -MAX_SPEED,
          velocity + pointerVelocity * VELOCITY_SCALE * (0.4 + strength * 0.6),
        );
        startRaf();
      } else if (!inRightZone && !inLeftZone) {
        velocity *= 0.7;
        if (Math.abs(velocity) < STOP_THRESHOLD) {
          velocity = 0;
          stopRaf();
        }
      }
    };

    const handlePointerCancel = () => {
      prevClientX = null;
      prevTimestamp = null;
      velocity = 0;
      stopRaf();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // Listen on listEl (tabListRef) — no mask-image here, full hit-testing
    listEl.addEventListener("pointermove", handlePointerMove);
    listEl.addEventListener("pointerleave", handlePointerLeave);
    listEl.addEventListener("pointercancel", handlePointerCancel);
    listEl.addEventListener("selectstart", handleSelectStart);

    return () => {
      stopRaf();
      listEl.removeEventListener("pointermove", handlePointerMove);
      listEl.removeEventListener("pointerleave", handlePointerLeave);
      listEl.removeEventListener("pointercancel", handlePointerCancel);
      listEl.removeEventListener("selectstart", handleSelectStart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerRef, vertical]);

  if (tabItems.length !== Children.count(children)) {
    throw new Error(
      "Tab component only accepts TabItem components as children",
    );
  }

  // Generate dynamic CSS mask for smooth edge fading when tabs overflow.
  // Applied to a wrapper div (NOT the scrollContainerRef) so mask-image
  // does not block pointer events on the scroll container's edge zones.
  const maskStyle = useMemo(() => {
    if (vertical || (!canScrollLeft && !canScrollRight)) return undefined;

    const leftStop = canScrollLeft
      ? "transparent, black 1.75rem"
      : "black 0rem";
    const rightStop = canScrollRight
      ? "black calc(100% - 1.75rem), transparent 100%"
      : "black 100%";

    const gradient = `linear-gradient(to right, ${leftStop}, ${rightStop})`;
    return {
      maskImage: gradient,
      WebkitMaskImage: gradient,
    };
  }, [canScrollLeft, canScrollRight, vertical]);

  return (
    <TabContextProvider
      tabId={tabId}
      tabCount={tabItems.length}
      vertical={vertical}
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      registerTab={registerTab}
      onActivePointerDown={onActivePointerDown}
    >
      <div className={cn("relative max-w-full", isDragging && "z-20")}>
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={ariaLabel}
          data-dragging={isDragging ? "" : undefined}
          className={cn(
            "bg-background border-border text-foreground relative inline-flex max-w-full items-center justify-center gap-1 overflow-visible rounded-full border p-1 select-none",
            className,
            "overflow-visible",
          )}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-0 origin-center overflow-visible"
            {...indicatorProps}
          >
            <motion.div
              className="pointer-events-none absolute -inset-1 rounded-full bg-white/55 dark:bg-white/35"
              style={{ opacity: glow }}
            />
            <motion.div
              className="pointer-events-none absolute -inset-0.5 rounded-full bg-white/80 dark:bg-white/50"
              style={{ opacity: glow }}
            />
            <span className="bg-background ring-border absolute inset-0 rounded-full ring-1" />
          </motion.div>
          {/* Mask wrapper: isolates mask-image from the scroll container so pointer
              events are not blocked on the edge zones by the transparent gradient */}
          <div
            style={maskStyle}
            className="relative z-10 w-full max-w-full min-w-0"
          >
            <div
              ref={scrollContainerRef}
              className={cn(
                "flex w-full max-w-full min-w-0 items-center gap-[inherit]",
                vertical
                  ? "flex-col overflow-x-visible overflow-y-auto"
                  : "snap-x snap-mandatory scrollbar-none overflow-x-auto overflow-y-visible overscroll-x-contain [&::-webkit-scrollbar]:hidden",
              )}
            >
              {tabItems.map((child, index) => {
                return cloneElement(child, {
                  index,
                } as unknown as ReactElement);
              })}
            </div>
          </div>
        </div>
      </div>
    </TabContextProvider>
  );
};

export default memo(Tab);
