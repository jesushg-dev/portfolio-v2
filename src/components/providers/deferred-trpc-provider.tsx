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

/**
 * Defers tRPC on the home landing until first interaction so Hero/LCP stays lean.
 * Skill intercept modals (`@modal/(...)skills`) mount tRPC hooks immediately on `/skills/*`.
 */
export default function DeferredTrpcProvider({
  children,
}: DeferredTrpcProviderProps) {
  const pathname = usePathname();
  const needsImmediateTrpc = isSkillInterceptRoute(pathname);
  const [deferredReady, setDeferredReady] = useState(false);
  const isReady = needsImmediateTrpc || deferredReady;

  useEffect(() => {
    if (needsImmediateTrpc) {
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
  }, [needsImmediateTrpc]);

  if (!isReady) {
    return children;
  }

  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
