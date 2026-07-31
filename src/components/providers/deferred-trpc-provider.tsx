"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "@/i18n/routing";
import { TRPCReactProvider } from "@/trpc/react";

interface DeferredTrpcProviderProps {
  children: ReactNode;
}

interface TrpcDeferredContextValue {
  isReady: boolean;
}

const TrpcDeferredContext = createContext<TrpcDeferredContextValue>({
  isReady: true,
});

export function useTrpcDeferredReady(): boolean {
  return useContext(TrpcDeferredContext).isReady;
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

/**
 * Defers tRPC on the home landing until first interaction so Hero/LCP stays lean.
 * Other routes under `(home)` (e.g. `/schedule`) mount the footer Spotify widget
 * immediately and need tRPC on first paint. Skill intercept modals also need tRPC right away.
 */
export default function DeferredTrpcProvider({
  children,
}: DeferredTrpcProviderProps) {
  const pathname = usePathname();
  const needsTrpcNow = needsImmediateTrpc(pathname);
  const [deferredReady, setDeferredReady] = useState(false);
  const isReady = needsTrpcNow || deferredReady;

  useLayoutEffect(() => {
    if (needsTrpcNow) return;

    // Scroll restoration on reload does not fire a scroll event.
    if (window.scrollY > 0) {
      setDeferredReady(true);
    }
  }, [needsTrpcNow]);

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

  const content = isReady ? (
    <TRPCReactProvider>{children}</TRPCReactProvider>
  ) : (
    children
  );

  return (
    <TrpcDeferredContext.Provider value={{ isReady }}>
      {content}
    </TrpcDeferredContext.Provider>
  );
}
