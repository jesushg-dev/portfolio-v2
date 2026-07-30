"use client";

import type { FC, ReactNode } from "react";
import {
  useCallback,
  useMemo,
  useState,
  Children,
  isValidElement,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  IOSNavigationContext,
  type NavigationRoute,
  type ScreenPresentation,
} from "./hooks/use-ios-navigation";
import { cn } from "@/lib/utils";

export interface IOSScreenProps {
  id: string;
  title?: string;
  presentation?: ScreenPresentation;
  children: ReactNode;
}

export const IOSScreen: FC<IOSScreenProps> = ({ children }) => {
  return <>{children}</>;
};

interface IOSNavigationStackProps {
  initialRoute: string;
  initialTitle?: string;
  children: ReactNode;
  className?: string;
}

export const IOSNavigationStack: FC<IOSNavigationStackProps> = ({
  initialRoute,
  initialTitle,
  children,
  className,
}) => {
  const [stack, setStack] = useState<NavigationRoute[]>([
    { id: initialRoute, title: initialTitle, presentation: "push" },
  ]);

  const push = useCallback(
    (id: string, params?: Record<string, unknown>, title?: string) => {
      setStack((prev) => [
        ...prev,
        { id, title, params, presentation: "push" },
      ]);
    },
    [],
  );

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const presentSheet = useCallback(
    (id: string, params?: Record<string, unknown>) => {
      setStack((prev) => [...prev, { id, params, presentation: "sheet" }]);
    },
    [],
  );

  const dismissSheet = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const top = prev[prev.length - 1];
      if (top.presentation === "sheet") {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  const activeRoute = stack[stack.length - 1] ?? null;
  const previousRoute = stack.length > 1 ? stack[stack.length - 2] : null;
  const canGoBack = stack.length > 1;

  const contextValue = useMemo(
    () => ({
      stack,
      activeRoute,
      previousRoute,
      push,
      pop,
      presentSheet,
      dismissSheet,
      canGoBack,
    }),
    [
      stack,
      activeRoute,
      previousRoute,
      push,
      pop,
      presentSheet,
      dismissSheet,
      canGoBack,
    ],
  );

  // Map children by screen ID
  const screenMap = useMemo(() => {
    const map = new Map<
      string,
      {
        content: ReactNode;
        presentation: ScreenPresentation;
        defaultTitle?: string;
      }
    >();
    Children.forEach(children, (child) => {
      if (isValidElement<IOSScreenProps>(child) && child.props.id) {
        map.set(child.props.id, {
          content: child.props.children,
          presentation: child.props.presentation ?? "push",
          defaultTitle: child.props.title,
        });
      }
    });
    return map;
  }, [children]);

  return (
    <IOSNavigationContext.Provider value={contextValue}>
      <div
        className={cn("relative size-full overflow-hidden bg-black", className)}
      >
        <AnimatePresence initial={false}>
          {stack.map((route, index) => {
            const isTop = index === stack.length - 1;
            const isPrevious = index === stack.length - 2;
            const screenConfig = screenMap.get(route.id);

            if (!screenConfig) return null;

            const isRouteSheet =
              route.presentation === "sheet" ||
              screenConfig.presentation === "sheet";

            const nextRoute = stack[index + 1];
            const nextConfig = nextRoute ? screenMap.get(nextRoute.id) : null;
            const isNextSheet = nextRoute
              ? nextRoute.presentation === "sheet" ||
                nextConfig?.presentation === "sheet"
              : false;

            return (
              <motion.div
                key={`${route.id}-${index}`}
                drag={isTop && isRouteSheet ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 80 || info.velocity.y > 350) {
                    dismissSheet();
                  }
                }}
                initial={
                  index === 0
                    ? { opacity: 1, x: 0, y: 0, scale: 1 }
                    : isRouteSheet
                      ? { y: "100%", x: 0, scale: 1, opacity: 1 }
                      : { x: "100%", y: 0, opacity: 1 }
                }
                animate={
                  isTop
                    ? { x: 0, y: 0, scale: 1, opacity: 1 }
                    : isPrevious
                      ? isNextSheet
                        ? { x: 0, y: 0, scale: 1, opacity: 1 }
                        : { x: "-30%", y: 0, scale: 1, opacity: 0.7 }
                      : { opacity: 0 }
                }
                exit={
                  isRouteSheet
                    ? {
                        y: "100%",
                        x: 0,
                        opacity: 1,
                        transition: {
                          duration: 0.28,
                          ease: [0.32, 0.72, 0, 1],
                        },
                      }
                    : {
                        x: "100%",
                        y: 0,
                        opacity: 1,
                        transition: {
                          duration: 0.28,
                          ease: [0.32, 0.72, 0, 1],
                        },
                      }
                }
                transition={{
                  duration: 0.32,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className={cn(
                  "absolute inset-0 size-full overflow-hidden bg-black shadow-2xl",
                  isRouteSheet && "rounded-t-3xl border-t border-white/10",
                )}
                style={{
                  zIndex: index + 10,
                }}
              >
                {isRouteSheet && (
                  <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center">
                    <div className="h-1 w-9 rounded-full bg-white/30" />
                  </div>
                )}
                {screenConfig.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </IOSNavigationContext.Provider>
  );
};

export default IOSNavigationStack;
