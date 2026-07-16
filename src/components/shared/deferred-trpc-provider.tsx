"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePathname } from "@/i18n/routing";
import { TRPCReactProvider } from "@/trpc/react";

interface DeferredTrpcProviderProps {
  children: ReactNode;
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isHomeRoute(pathname: string): boolean {
  return pathname === "/";
}

export default function DeferredTrpcProvider({
  children,
}: DeferredTrpcProviderProps) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(() => isAdminRoute(pathname));

  if (isAdminRoute(pathname) && !isReady) {
    setIsReady(true);
  }

  if (
    !isHomeRoute(pathname) &&
    !isAdminRoute(pathname) &&
    !isReady &&
    typeof document !== "undefined" &&
    document.readyState === "complete"
  ) {
    setIsReady(true);
  }

  useEffect(() => {
    if (isAdminRoute(pathname) || isHomeRoute(pathname)) {
      if (!isHomeRoute(pathname)) {
        return;
      }

      const onInteraction = () => setIsReady(true);

      window.addEventListener("scroll", onInteraction, {
        passive: true,
        once: true,
      });
      window.addEventListener("pointerdown", onInteraction, { once: true });
      window.addEventListener("keydown", onInteraction, { once: true });

      return () => {
        window.removeEventListener("scroll", onInteraction);
        window.removeEventListener("pointerdown", onInteraction);
        window.removeEventListener("keydown", onInteraction);
      };
    }

    if (document.readyState === "complete") {
      return;
    }

    const onLoad = () => setIsReady(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [pathname]);

  if (!isReady) {
    return children;
  }

  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
