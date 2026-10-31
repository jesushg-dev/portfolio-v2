"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { usePublicWidgetsReady } from "@/components/providers/public-widgets-provider";

interface ViewportSectionProps {
  children: ReactNode;
  fallback: ReactNode;
  /** Reserved height to avoid CLS while the section has not mounted. */
  minHeight?: CSSProperties["minHeight"];
  rootMargin?: string;
  id?: string;
  className?: string;
  /** Waits for interaction before mounting optional live widgets on the home page. */
  requiresInteraction?: boolean;
}

export default function ViewportSection({
  children,
  fallback,
  minHeight = "24rem",
  rootMargin = "250px 0px",
  id,
  className,
  requiresInteraction = false,
}: ViewportSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const widgetsReady = usePublicWidgetsReady();
  const canMountChildren = isVisible && (!requiresInteraction || widgetsReady);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const parsedMargin = Number.parseInt(rootMargin, 10) || 200;

    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      if (
        rect.top <= window.innerHeight + parsedMargin &&
        rect.bottom >= -parsedMargin
      ) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

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

    const onScroll = () => {
      if (checkVisibility()) {
        observer.disconnect();
        window.removeEventListener("scroll", onScroll, true);
      }
    };
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll, true);
    };
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
