"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  animate,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import { getNearestTabIndex, type TabRect } from "./get-nearest-tab-index";
import {
  getTabIndicatorLiftScale,
  TAB_INDICATOR_GLOW_OPACITY,
} from "./tab-indicator-lift";

const SPRING = {
  type: "spring" as const,
  stiffness: 500,
  damping: 40,
  mass: 0.6,
};

function getRelativeRect(
  element: HTMLElement,
  container: HTMLElement,
): TabRect {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    left:
      elementRect.left -
      containerRect.left -
      container.clientLeft +
      container.scrollLeft,
    top:
      elementRect.top -
      containerRect.top -
      container.clientTop +
      container.scrollTop,
    width: elementRect.width,
    height: elementRect.height,
  };
}

function rectsEqual(
  a: readonly (TabRect | undefined)[],
  b: readonly (TabRect | undefined)[],
) {
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (!left || !right) {
      if (left !== right) return false;
      continue;
    }
    if (
      left.left !== right.left ||
      left.top !== right.top ||
      left.width !== right.width ||
      left.height !== right.height
    ) {
      return false;
    }
  }

  return true;
}

interface DragConstraints {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface TabMeasurements {
  rects: readonly (TabRect | undefined)[];
  constraints: DragConstraints;
}

const EMPTY_MEASUREMENTS: TabMeasurements = {
  rects: [],
  constraints: { left: 0, right: 0, top: 0, bottom: 0 },
};

function constraintsEqual(a: DragConstraints, b: DragConstraints) {
  return (
    a.left === b.left &&
    a.right === b.right &&
    a.top === b.top &&
    a.bottom === b.bottom
  );
}

/**
 * Measurements live outside React state: they are produced by layout effects,
 * ResizeObserver callbacks and ref callbacks, and `useSyncExternalStore` lets
 * those writers publish a new snapshot without calling setState from an effect.
 */
function createMeasurementStore() {
  let snapshot = EMPTY_MEASUREMENTS;
  const listeners = new Set<() => void>();

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    publish: (next: TabMeasurements) => {
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}

interface UseTabIndicatorDragOptions {
  currentTab: number;
  setCurrentTab: (index: number) => void;
  vertical: boolean;
  tabCount: number;
}

export function useTabIndicatorDrag({
  currentTab,
  setCurrentTab,
  vertical,
  tabCount,
}: UseTabIndicatorDragOptions) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabNodesRef = useRef(new Map<number, HTMLElement>());
  const [store] = useState(createMeasurementStore);
  const observerRef = useRef<ResizeObserver | null>(null);
  const isDraggingRef = useRef(false);
  const hasPositionedRef = useRef(false);
  const liftGenerationRef = useRef(0);
  const currentTabRef = useRef(currentTab);
  const setCurrentTabRef = useRef(setCurrentTab);
  const [isDragging, setIsDragging] = useState(false);
  const { rects, constraints: dragConstraints } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const glow = useMotionValue(0);
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotionRef = useRef(shouldReduceMotion);
  const verticalRef = useRef(vertical);

  // Latest-value refs for callbacks that must not change identity mid-drag.
  useLayoutEffect(() => {
    currentTabRef.current = currentTab;
    setCurrentTabRef.current = setCurrentTab;
    reduceMotionRef.current = shouldReduceMotion;
    verticalRef.current = vertical;
  }, [currentTab, setCurrentTab, shouldReduceMotion, vertical]);

  const applyLift = useCallback(
    (active: boolean) => {
      if (reduceMotionRef.current) {
        scaleX.set(1);
        scaleY.set(1);
        glow.set(0);
        return Promise.resolve();
      }

      const lift = getTabIndicatorLiftScale(
        verticalRef.current,
        width.get(),
        height.get(),
      );
      return Promise.all([
        animate(scaleX, active ? lift.scaleX : 1, SPRING),
        animate(scaleY, active ? lift.scaleY : 1, SPRING),
        animate(glow, active ? TAB_INDICATOR_GLOW_OPACITY : 0, SPRING),
      ]);
    },
    [glow, height, scaleX, scaleY, width],
  );

  const measure = useCallback(() => {
    const list = tabListRef.current;
    if (!list) return;

    const next: (TabRect | undefined)[] = [];
    for (let index = 0; index < tabCount; index += 1) {
      const node = tabNodesRef.current.get(index);
      if (!node) continue;
      next[index] = getRelativeRect(node, list);
    }

    const previous = store.getSnapshot();
    const first = next.find((rect) => rect);
    const last = [...next].reverse().find((rect) => rect);
    const nextConstraints =
      first && last
        ? {
            left: first.left,
            right: last.left,
            top: first.top,
            bottom: last.top,
          }
        : previous.constraints;

    const sameRects = rectsEqual(previous.rects, next);
    const sameConstraints = constraintsEqual(
      previous.constraints,
      nextConstraints,
    );
    if (sameRects && sameConstraints) return;

    store.publish({
      rects: sameRects ? previous.rects : next,
      constraints: sameConstraints ? previous.constraints : nextConstraints,
    });
  }, [store, tabCount]);

  const registerTab = useCallback(
    (index: number, node: HTMLElement | null) => {
      if (index < 0) return;

      const previous = tabNodesRef.current.get(index);
      if (previous && previous !== node) {
        observerRef.current?.unobserve(previous);
      }

      if (node) {
        tabNodesRef.current.set(index, node);
        observerRef.current?.observe(node);
      } else {
        tabNodesRef.current.delete(index);
      }

      measure();
    },
    [measure],
  );

  useEffect(() => {
    const list = tabListRef.current;
    const scroller = scrollContainerRef.current ?? list;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observerRef.current = observer;

    if (list) observer.observe(list);
    if (scroller && scroller !== list) observer.observe(scroller);
    tabNodesRef.current.forEach((node) => observer.observe(node));

    scroller?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      observerRef.current = null;
      scroller?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useLayoutEffect(() => {
    measure();
  }, [measure, currentTab, tabCount]);

  useEffect(() => {
    if (isDraggingRef.current) return;

    const rect = rects[currentTab];
    if (!rect) return;

    if (!hasPositionedRef.current || shouldReduceMotion) {
      x.set(rect.left);
      y.set(rect.top);
      width.set(rect.width);
      height.set(rect.height);
      hasPositionedRef.current = true;
      return;
    }

    void animate(x, rect.left, SPRING);
    void animate(y, rect.top, SPRING);
    void animate(width, rect.width, SPRING);
    void animate(height, rect.height, SPRING);
  }, [currentTab, height, rects, shouldReduceMotion, width, x, y]);

  const snapToNearest = useCallback(() => {
    const axis = vertical ? "y" : "x";
    const point = {
      x: x.get() + width.get() / 2,
      y: y.get() + height.get() / 2,
    };
    const currentRects = store.getSnapshot().rects;
    const nextIndex = getNearestTabIndex(point, currentRects, axis);
    const rect = currentRects[nextIndex];

    if (nextIndex !== currentTabRef.current) {
      setCurrentTabRef.current(nextIndex);
      return;
    }

    if (!rect) return;

    if (shouldReduceMotion) {
      x.set(rect.left);
      y.set(rect.top);
      width.set(rect.width);
      height.set(rect.height);
      return;
    }

    void animate(x, rect.left, SPRING);
    void animate(y, rect.top, SPRING);
    void animate(width, rect.width, SPRING);
    void animate(height, rect.height, SPRING);
  }, [height, shouldReduceMotion, store, vertical, width, x, y]);

  const onActivePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      liftGenerationRef.current += 1;
      isDraggingRef.current = true;
      setIsDragging(true);
      x.stop();
      y.stop();
      width.stop();
      height.stop();
      scaleX.stop();
      scaleY.stop();
      glow.stop();
      void applyLift(true);
      dragControls.start(event);
    },
    [applyLift, dragControls, glow, height, scaleX, scaleY, width, x, y],
  );

  return {
    tabListRef,
    scrollContainerRef,
    registerTab,
    onActivePointerDown,
    isDragging,
    glow,
    indicatorProps: {
      drag: vertical ? ("y" as const) : ("x" as const),
      dragControls,
      dragListener: false,
      dragConstraints,
      dragElastic: 0,
      dragMomentum: false,
      style: { x, y, width, height, scaleX, scaleY },
      onDragStart: () => {
        isDraggingRef.current = true;
        setIsDragging(true);
        void applyLift(true);
      },
      onDragEnd: () => {
        isDraggingRef.current = false;
        const generation = liftGenerationRef.current;
        snapToNearest();
        void applyLift(false).then(() => {
          if (generation !== liftGenerationRef.current) return;
          if (isDraggingRef.current) return;
          setIsDragging(false);
        });
      },
    },
  };
}
