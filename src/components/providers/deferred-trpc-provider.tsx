"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePathname } from "@/i18n/routing";
import { TRPCReactProvider } from "@/trpc/react";

interface DeferredTrpcProviderProps {
  children: ReactNode;
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

  useEffect(() => {
    if (needsTrpcNow) {
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
  }, [needsTrpcNow]);

  if (!isReady) {
    return children;
  }

  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
