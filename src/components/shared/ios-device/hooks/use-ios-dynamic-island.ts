"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DynamicIslandState = "compact" | "expanded" | "minimal" | "hidden";

export interface DynamicIslandContent {
  leading?: ReactNode;
  trailing?: ReactNode;
  expandedContent?: ReactNode;
}

export interface IOSDynamicIslandContextValue {
  islandState: DynamicIslandState;
  setIslandState: (state: DynamicIslandState) => void;
  content: DynamicIslandContent;
  updateContent: (content: DynamicIslandContent) => void;
}

export const IOSDynamicIslandContext =
  createContext<IOSDynamicIslandContextValue | null>(null);

export function useIOSDynamicIsland(): IOSDynamicIslandContextValue {
  const context = useContext(IOSDynamicIslandContext);
  if (!context) {
    // Return dummy fallback if used outside context
    return {
      islandState: "compact",
      setIslandState: () => undefined,
      content: {},
      updateContent: () => undefined,
    };
  }
  return context;
}
