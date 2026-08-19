"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { InfoIcon, XIcon } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/react";

import { cn } from "@/lib/utils";
import { useBodyOverlayLocked } from "@/hooks/use-body-overlay-lock";
import { usePathname } from "@/i18n/routing";
import { isSchedulePath } from "@/utils/calendly-url";

export const ACTION_HINT_STORAGE_KEY = "action-hint-seen";
export const NOW_PLAYING_HINT_STORAGE_KEY = ACTION_HINT_STORAGE_KEY;

const IS_DEV = process.env.NODE_ENV === "development";

function subscribeToHintStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredDismissed(persistDismissal: boolean, storageKey: string) {
  if (IS_DEV || !persistDismissal) return false;
  return window.localStorage.getItem(storageKey) === "1";
}

/** Persist hint dismissal for returning visitors (skipped in dev for QA). */
export function persistActionHintDismissal(
  storageKey: string = ACTION_HINT_STORAGE_KEY,
) {
  if (IS_DEV) return;
  window.localStorage.setItem(storageKey, "1");
}

export const persistNowPlayingHintDismissal = persistActionHintDismissal;

export interface ActionHintProps {
  /** Target element to anchor the hint to. */
  children: ReactNode;
  /** Delay before the hint appears, in ms. */
  delay?: number;
  /** Callout text. */
  label?: string;
  /** Custom localStorage key for persisting dismissal state. */
  storageKey?: string;
  /** Remember dismissal in localStorage so returning visitors don't see it again. */
  persistDismissal?: boolean;
  /** Hide the hint without persisting dismissal. */
  hidden?: boolean;
  /** Custom leading icon. */
  icon?: ReactNode;
  /** Class name for the anchor wrapper. */
  className?: string;
  /** Class name for the tooltip bubble. */
  bubbleClassName?: string;
}

export type NowPlayingHintProps = ActionHintProps;

export function ActionHint({
  children,
  delay = 700,
  label = "Tap to view details",
  storageKey = ACTION_HINT_STORAGE_KEY,
  persistDismissal = true,
  hidden = false,
  icon,
  className,
  bubbleClassName,
}: ActionHintProps) {
  const [visible, setVisible] = useState(() => delay === 0);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const overlayLocked = useBodyOverlayLocked();

  const storedDismissed = useSyncExternalStore(
    subscribeToHintStorage,
    () => getStoredDismissed(persistDismissal, storageKey),
    () => false,
  );

  const dismissed = storedDismissed || sessionDismissed;

  useEffect(() => {
    if (dismissed) return;

    if (delay > 0) {
      const timer = window.setTimeout(() => setVisible(true), delay);
      return () => window.clearTimeout(timer);
    }
  }, [delay, dismissed]);

  const showHint =
    visible &&
    !dismissed &&
    !hidden &&
    !overlayLocked &&
    !isSchedulePath(pathname);

  const [arrowElement, setArrowElement] = useState<HTMLSpanElement | null>(
    null,
  );

  const { refs, floatingStyles, placement, middlewareData } = useFloating({
    open: showHint,
    placement: "top",
    strategy: "fixed",
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, {
        elementResize: typeof ResizeObserver !== "undefined",
      }),
    middleware: [
      offset(14),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
      arrow({ element: arrowElement, padding: 8 }),
    ],
  });

  const setReferenceNode = useCallback(
    (node: HTMLElement | null) => {
      refs.setReference(node);
    },
    [refs],
  );

  const setFloatingNode = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  const side = placement.split("-")[0];
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;

  const arrowSideClasses: Record<string, string> = {
    top: "-bottom-1 border-r border-b",
    bottom: "-top-1 border-l border-t",
    left: "-right-1 border-t border-r",
    right: "-left-1 border-b border-l",
  };

  function dismiss() {
    setVisible(false);
    setSessionDismissed(true);
    if (persistDismissal) {
      persistActionHintDismissal(storageKey);
    }
  }

  return (
    <>
      <div
        ref={setReferenceNode}
        className={cn("relative", className)}
        onClickCapture={dismiss}
      >
        {children}

        {showHint && (
          <span className="pointer-events-none absolute top-1 right-1 z-10 size-2.5">
            <span className="bg-primary absolute inset-0 rounded-full shadow-sm" />
            {!reduceMotion && (
              <motion.span
                className="bg-primary/45 absolute inset-0 rounded-full"
                initial={{ scale: 1, opacity: 0.55 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: [0.16, 1, 0.3, 1],
                  repeatDelay: 1,
                }}
                style={{ transformOrigin: "center" }}
              />
            )}
          </span>
        )}
      </div>

      <AnimatePresence>
        {showHint && (
          <div
            ref={setFloatingNode}
            className="z-9999"
            style={floatingStyles}
            onClickCapture={dismiss}
          >
            <motion.div
              onClick={dismiss}
              initial={{ opacity: 0, scale: 0.92, y: side === "top" ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: side === "top" ? 6 : -6 }}
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 420, damping: 28 }
              }
              className={cn(
                "bg-popover/95 text-popover-foreground border-border pointer-events-auto relative flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-2.5 rounded-xl border py-2.5 pr-10 pl-3.5 text-xs leading-snug shadow-xl backdrop-blur-md sm:text-sm",
                bubbleClassName,
              )}
            >
              {icon ?? (
                <InfoIcon
                  className="text-primary size-4.5 shrink-0 sm:size-4"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              <span className="pr-1 font-medium">{label}</span>
              <button
                type="button"
                aria-label="Dismiss hint"
                onClick={dismiss}
                onPointerDown={dismiss}
                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus-visible:ring-1 focus-visible:outline-none sm:size-6"
              >
                <XIcon className="size-4.5 sm:size-3.5" strokeWidth={2} />
              </button>
              <span
                ref={setArrowElement}
                className={cn(
                  "bg-popover border-border absolute size-2.5 rotate-45",
                  arrowSideClasses[side] ?? "-bottom-1 border-r border-b",
                )}
                style={{
                  left: arrowX != null ? `${arrowX}px` : undefined,
                  top: arrowY != null ? `${arrowY}px` : undefined,
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export const NowPlayingHint = ActionHint;
export default ActionHint;
