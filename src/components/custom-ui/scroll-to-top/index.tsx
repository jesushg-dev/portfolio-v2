"use client";

import type { FC, MouseEvent, RefObject } from "react";
import { useEffect, useState } from "react";
import { BiArrowFromBottom } from "react-icons/bi";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  /** Scroll container. When omitted, listens to `window`. */
  containerRef?: RefObject<HTMLElement | null>;
  threshold?: number;
  className?: string;
}

const ScrollToTop: FC<ScrollToTopProps> = ({
  containerRef,
  threshold = 300,
  className,
}) => {
  const t = useTranslations("global.header");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const readOffset = () => {
      if (containerRef?.current) return containerRef.current.scrollTop;
      return window.scrollY;
    };

    const onScroll = () => {
      setIsVisible(readOffset() > threshold);
    };

    const node = containerRef?.current;
    onScroll();

    if (node) {
      node.addEventListener("scroll", onScroll, { passive: true });
      return () => node.removeEventListener("scroll", onScroll);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [containerRef, threshold]);

  const scrollToTop = (event: MouseEvent<HTMLButtonElement>) => {
    const node = containerRef?.current;
    if (node) {
      node.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    event.preventDefault();
    event.currentTarget.blur();
  };

  const button = (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t("scrollToTop")}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring pointer-events-auto inline-flex items-center rounded-full p-3 shadow-xs transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
    >
      <BiArrowFromBottom className="h-6 w-6" aria-hidden="true" />
    </button>
  );

  if (containerRef) return button;

  return <div className="fixed right-2 bottom-2 z-50">{button}</div>;
};

export default ScrollToTop;
