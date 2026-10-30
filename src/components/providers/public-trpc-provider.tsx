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
import { TRPCReactProvider } from "@/trpc/react";

interface PublicTrpcProviderProps {
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

function isSkillInterceptRoute(pathname: string): boolean {
  return pathname.startsWith("/skills/");
}

function isHomeLandingRoute(pathname: string): boolean {
  return pathname === "/";
}

function needsImmediateTrpc(pathname: string): boolean {
  return isSkillInterceptRoute(pathname) || !isHomeLandingRoute(pathname);
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
 * Provides tRPC during prerendering and hydration. Only optional live widgets
 * wait for interaction on the landing page; public content always renders.
 */
export default function PublicTrpcProvider({
  children,
}: PublicTrpcProviderProps) {
  const pathname = usePathname();
  const needsTrpcNow = needsImmediateTrpc(pathname);
  const [deferredReady, setDeferredReady] = useState(false);
  const scrollRestored = useSyncExternalStore(
    emptySubscribe,
    getScrollRestoredSnapshot,
    getScrollRestoredServerSnapshot,
  );
  const isReady =
    needsTrpcNow || deferredReady || (!needsTrpcNow && scrollRestored);

  useEffect(() => {
    if (needsTrpcNow || deferredReady) {
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
  }, [needsTrpcNow, deferredReady]);

  return (
    <TRPCReactProvider>
      <PublicWidgetsContext.Provider value={{ isReady }}>
        {children}
      </PublicWidgetsContext.Provider>
    </TRPCReactProvider>
  );
}
