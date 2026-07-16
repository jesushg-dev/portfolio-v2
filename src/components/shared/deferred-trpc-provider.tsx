"use client";

import { useEffect, useState, type ReactNode } from "react";

import { TRPCReactProvider } from "@/trpc/react";

interface DeferredTrpcProviderProps {
  children: ReactNode;
}

export default function DeferredTrpcProvider({
  children,
}: DeferredTrpcProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const removeInteractionListeners = (onInteraction: () => void) => {
      window.removeEventListener("scroll", onInteraction);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };

    const activate = (onInteraction: () => void) => {
      if (cancelled) return;
      cancelled = true;
      removeInteractionListeners(onInteraction);
      setIsReady(true);
    };

    const onInteraction = () => activate(onInteraction);

    window.addEventListener("scroll", onInteraction, { passive: true });
    window.addEventListener("pointerdown", onInteraction);
    window.addEventListener("keydown", onInteraction);

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => activate(onInteraction), {
        timeout: 1200,
      });
    } else {
      timeoutId = window.setTimeout(() => activate(onInteraction), 900);
    }

    return () => {
      cancelled = true;
      removeInteractionListeners(onInteraction);
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!isReady) {
    return children;
  }

  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
