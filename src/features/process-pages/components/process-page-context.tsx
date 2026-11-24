"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

interface ProcessPageNavContextValue {
  registerSection: (id: string, node: HTMLElement | null) => void;
  getSection: (id: string) => HTMLElement | null;
}

const ProcessPageNavContext = createContext<ProcessPageNavContextValue | null>(
  null,
);

export function ProcessPageNavProvider({ children }: { children: ReactNode }) {
  const sectionsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerSection = useCallback(
    (id: string, node: HTMLElement | null) => {
      if (node) {
        sectionsRef.current.set(id, node);
      } else {
        sectionsRef.current.delete(id);
      }
    },
    [],
  );

  const getSection = useCallback((id: string) => {
    return sectionsRef.current.get(id) ?? null;
  }, []);

  return (
    <ProcessPageNavContext.Provider value={{ registerSection, getSection }}>
      {children}
    </ProcessPageNavContext.Provider>
  );
}

export function useProcessPageNav() {
  return useContext(ProcessPageNavContext);
}
