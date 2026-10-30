"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "@/i18n/routing";

interface PublicWidgetsProviderProps {
  children: ReactNode;
}

interface PublicWidgetsContextValue {
  isReady: boolean;
}

const PublicWidgetsContext = createContext<PublicWidgetsContextValue>({
  isReady: true,
});

export function usePublicWidgetsReady(): boolean {
  return useContext(PublicWidgetsContext).isReady;
}

const emptySubscribe = () => () => {
  /* empty */
};

function getScrollRestoredSnapshot(): boolean {
  return window.scrollY > 0;
}

function getScrollRestoredServerSnapshot(): boolean {
  return false;
}

/**
 * Coordinates optional widgets without importing their query or notification
 * runtimes. Public content stays in the same tree throughout hydration.
 */
export default function PublicWidgetsProvider({
  children,
}: PublicWidgetsProviderProps) {
  const pathname = usePathname();
  const needsWidgetsNow = pathname !== "/";
  const [deferredReady, setDeferredReady] = useState(false);
  const scrollRestored = useSyncExternalStore(
    emptySubscribe,
    getScrollRestoredSnapshot,
    getScrollRestoredServerSnapshot,
  );
  const isReady = needsWidgetsNow || deferredReady || scrollRestored;

  useEffect(() => {
    if (needsWidgetsNow || deferredReady) {
      return;
    }

    const enable = () => setDeferredReady(true);

    window.addEventListener("scroll", enable, { passive: true, once: true });
    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });

    return () => {
      window.removeEventListener("scroll", enable);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, [needsWidgetsNow, deferredReady]);

  return (
    <PublicWidgetsContext.Provider value={{ isReady }}>
      {children}
    </PublicWidgetsContext.Provider>
  );
}
