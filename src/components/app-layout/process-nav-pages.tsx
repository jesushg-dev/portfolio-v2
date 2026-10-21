"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";

const ProcessNavPagesContext = createContext<ProcessNavPage[]>([]);

export function ProcessNavPagesProvider({
  pages,
  children,
}: {
  pages: ProcessNavPage[];
  children: ReactNode;
}) {
  return (
    <ProcessNavPagesContext.Provider value={pages}>
      {children}
    </ProcessNavPagesContext.Provider>
  );
}

export function useProcessNavPages() {
  return useContext(ProcessNavPagesContext);
}
