"use client";

import {
  useCallback,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Link } from "@/i18n/routing";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface LinkPreviewProps {
  url: string;
  imageSrc: string;
  imageAlt: string;
  width?: number;
  height?: number;
  className?: string;
  children: ReactNode;
}

type InternalHref = ComponentProps<typeof Link>["href"];

const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function resolveInternalHref(url: string): InternalHref {
  const [pathname, search = ""] = url.split("?", 2);

  if (!search) {
    return pathname as InternalHref;
  }

  const query = Object.fromEntries(new URLSearchParams(search));

  return {
    pathname,
    query,
  } as InternalHref;
}

export function LinkPreview({
  url,
  imageSrc,
  imageAlt,
  width = 200,
  height = 125,
  className,
  children,
}: LinkPreviewProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const canHoverPreview = useMediaQuery(HOVER_MEDIA_QUERY);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback((event: MouseEvent<HTMLSpanElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    setOffsetX(relativeX * 36);
  }, []);

  const handleEnter = useCallback(() => {
    if (canHoverPreview) setIsHovered(true);
  }, [canHoverPreview]);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
    setOffsetX(0);
  }, []);

  const linkClassName = cn("inline-flex", className);

  const trigger = isExternalUrl(url) ? (
    <a
      href={url}
      className={linkClassName}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    <Link href={resolveInternalHref(url)} className={linkClassName}>
      {children}
    </Link>
  );

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
    >
      {trigger}

      {canHoverPreview ? (
        <AnimatePresence>
          {isHovered ? (
            <motion.div
              key="link-preview"
              role="presentation"
              aria-hidden
              initial={
                shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 10 }
              }
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-none absolute bottom-full z-50 mb-3"
              style={{
                width,
                height,
                left: `calc(50% + ${offsetX}px - ${width / 2}px)`,
              }}
            >
              <div className="bg-card border-border relative h-full w-full overflow-hidden rounded-lg border shadow-lg">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={width}
                  height={height}
                  className="h-full w-full object-cover"
                  sizes={`${width}px`}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </span>
  );
}

export default LinkPreview;
