"use client";

import { createContext, useContext } from "react";

export type ScreenPresentation = "push" | "sheet";

export interface NavigationRoute {
  id: string;
  title?: string;
  params?: Record<string, unknown>;
  presentation?: ScreenPresentation;
}

export interface IOSNavigationContextValue {
  stack: NavigationRoute[];
  activeRoute: NavigationRoute | null;
  previousRoute: NavigationRoute | null;
  push: (id: string, params?: Record<string, unknown>, title?: string) => void;
  pop: () => void;
  presentSheet: (id: string, params?: Record<string, unknown>) => void;
  dismissSheet: () => void;
  canGoBack: boolean;
}

export const IOSNavigationContext =
  createContext<IOSNavigationContextValue | null>(null);

export function useIOSNavigation(): IOSNavigationContextValue {
  const context = useContext(IOSNavigationContext);
  if (!context) {
    return {
      stack: [],
      activeRoute: null,
      previousRoute: null,
      push: () => undefined,
      pop: () => undefined,
      presentSheet: () => undefined,
      dismissSheet: () => undefined,
      canGoBack: false,
    };
  }
  return context;
}
