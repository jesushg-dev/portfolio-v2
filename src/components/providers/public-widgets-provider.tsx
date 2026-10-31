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

const subscribeScroll = (onStoreChange: () => void) => {
  window.addEventListener("scroll", onStoreChange, {
    passive: true,
    capture: true,
  });
  return () => {
    window.removeEventListener("scroll", onStoreChange, { capture: true });
  };
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
    subscribeScroll,
    getScrollRestoredSnapshot,
    getScrollRestoredServerSnapshot,
  );
  const isReady = needsWidgetsNow || deferredReady || scrollRestored;

  useEffect(() => {
    if (needsWidgetsNow || deferredReady) {
      return;
    }

    const enable = () => {
      setDeferredReady(true);
    };

    window.addEventListener("scroll", enable, {
      passive: true,
      once: true,
      capture: true,
    });
    window.addEventListener("wheel", enable, {
      passive: true,
      once: true,
      capture: true,
    });
    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });
    document.addEventListener("scroll", enable, { passive: true, once: true });

    return () => {
      window.removeEventListener("scroll", enable, { capture: true });
      window.removeEventListener("wheel", enable, { capture: true });
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
      document.removeEventListener("scroll", enable);
    };
  }, [needsWidgetsNow, deferredReady]);

  return (
    <PublicWidgetsContext.Provider value={{ isReady }}>
      {children}
    </PublicWidgetsContext.Provider>
  );
}
