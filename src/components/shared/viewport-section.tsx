"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useTrpcDeferredReady } from "@/components/providers/deferred-trpc-provider";

interface ViewportSectionProps {
  children: ReactNode;
  fallback: ReactNode;
  /** Reserved height to avoid CLS while the section has not mounted. */
  minHeight?: CSSProperties["minHeight"];
  rootMargin?: string;
  id?: string;
  className?: string;
  /** When true, waits for deferred tRPC before mounting children. */
  requiresTrpc?: boolean;
}

export default function ViewportSection({
  children,
  fallback,
  minHeight = "24rem",
  rootMargin = "250px 0px",
  id,
  className,
  requiresTrpc = false,
}: ViewportSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const trpcReady = useTrpcDeferredReady();
  const canMountChildren = isVisible && (!requiresTrpc || trpcReady);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={canMountChildren ? undefined : { minHeight }}
    >
      {canMountChildren ? children : fallback}
    </div>
  );
}
