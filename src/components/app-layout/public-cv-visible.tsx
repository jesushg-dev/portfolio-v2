"use client";

import { createContext, useContext, type ReactNode } from "react";

const PublicCvVisibleContext = createContext(true);

export function PublicCvVisibleProvider({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <PublicCvVisibleContext.Provider value={visible}>
      {children}
    </PublicCvVisibleContext.Provider>
  );
}

export function usePublicCvVisible() {
  return useContext(PublicCvVisibleContext);
}
