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
import { useLocale } from "next-intl";

import { Link } from "@/i18n/routing";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface LinkPreviewProps {
  url: string;
  imageSrc?: string;
  imageAlt?: string;
  width?: number;
  height?: number;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
}

type InternalHref = ComponentProps<typeof Link>["href"];

const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

const ROUTE_PREVIEW_MAP: Record<string, string> = {
  // Curriculum Vitae
  "/curriculum-vitae": "/previews/curriculum.webp",
  "/cv": "/previews/curriculum.webp",
  "/curriculum": "/previews/curriculum.webp",

  // Certificates
  "/certificates": "/previews/certificates.webp",
  "/certificados": "/previews/certificates.webp",
  "/certificaten": "/previews/certificates.webp",

  // Timeline
  "/timeline": "/previews/timeline.webp",
  "/linea-de-tiempo": "/previews/timeline.webp",
  "/tijdlijn": "/previews/timeline.webp",

  // CV Generator
  "/register?next=/admin/cv": "/previews/cv-generator.webp",
  "/register": "/previews/cv-generator.webp",
  "/registrarse": "/previews/cv-generator.webp",
  "/registreren": "/previews/cv-generator.webp",
  "/cv/generator": "/previews/cv-generator.webp",
  "/cvGenerator": "/previews/cv-generator.webp",

  // Projects
  "/projects": "/previews/projects.webp",
  "/proyectos": "/previews/projects.webp",
  "/projecten": "/previews/projects.webp",

  // Colophon
  "/colophon": "/previews/colophon.webp",
  "/colofon": "/previews/colofon.webp",

  // Stats
  "/stats": "/previews/stats.webp",
  "/estadisticas": "/previews/stats.webp",
  "/statistieken": "/previews/stats.webp",

  // Uses & Now
  "/uses": "/previews/uses.webp",
  "/now": "/previews/now.webp",

  // Process Pages
  "/process/how-i-use-ai": "/previews/process-how-i-use-ai.webp",
  "/proceso/how-i-use-ai": "/previews/process-how-i-use-ai.webp",
  "/proces/how-i-use-ai": "/previews/process-how-i-use-ai.webp",
  "/process/qa-collaboration": "/previews/process-qa-collaboration.webp",
  "/proceso/qa-collaboration": "/previews/process-qa-collaboration.webp",
  "/proces/qa-collaboration": "/previews/process-qa-collaboration.webp",
};

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function resolvePreviewImageSrc(
  url: string,
  locale = "en",
  explicitImageSrc?: string,
): string {
  if (explicitImageSrc) {
    if (isExternalUrl(explicitImageSrc)) return explicitImageSrc;
    if (
      explicitImageSrc.startsWith("/previews/") &&
      !explicitImageSrc.startsWith(`/previews/${locale}/`)
    ) {
      return explicitImageSrc.replace("/previews/", `/previews/${locale}/`);
    }
    return explicitImageSrc;
  }

  if (isExternalUrl(url)) {
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=800`;
  }

  const cleanPath = url.split("?")[0]?.replace(/\/$/, "") ?? "";
  const mapped =
    ROUTE_PREVIEW_MAP[url] ||
    ROUTE_PREVIEW_MAP[cleanPath] ||
    `/previews/${cleanPath.replace(/^\//, "")}.webp`;

  return mapped.replace("/previews/", `/previews/${locale}/`);
}

function resolveInternalHref(url: string): InternalHref {
  const [pathname, search = ""] = url.split("?", 2);

  const processMatch = /^\/process\/([^/]+)$/.exec(pathname);
  if (processMatch) {
    return {
      pathname: "/process/[slug]",
      params: { slug: processMatch[1] },
    } as unknown as InternalHref;
  }

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
  prefetch,
}: LinkPreviewProps) {
  const locale = useLocale();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const canHoverPreview = useMediaQuery(HOVER_MEDIA_QUERY);

  const previewImageSrc = resolvePreviewImageSrc(url, locale, imageSrc);
  const rootFallbackSrc = previewImageSrc.replace(
    new RegExp(`^/previews/${locale}/`),
    "/previews/",
  );
  const finalImageSrc = imageError ? rootFallbackSrc : previewImageSrc;

  const previewImageAlt = imageAlt ?? `Preview of ${url}`;
  const isExternalPreview = finalImageSrc.startsWith("https://s0.wp.com");

  const handleMouseMove = useCallback((event: MouseEvent<HTMLSpanElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    setOffsetX(relativeX * 36);
  }, []);

  const handleEnter = useCallback(() => {
    if (canHoverPreview) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < height + 24) {
          setPlacement("bottom");
        } else {
          setPlacement("top");
        }
      }
      setIsHovered(true);
    }
  }, [canHoverPreview, height]);

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
    <Link
      href={resolveInternalHref(url)}
      prefetch={prefetch}
      className={linkClassName}
    >
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

      {canHoverPreview && isHovered ? (
        <div
          role="presentation"
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-50 transition-all duration-200 ease-out",
            placement === "top" ? "bottom-full mb-3" : "top-full mt-3",
          )}
          style={{
            width,
            height,
            left: `calc(50% + ${offsetX}px - ${width / 2}px)`,
          }}
        >
          <div className="bg-card border-border relative h-full w-full overflow-hidden rounded-lg border shadow-lg">
            <Image
              src={finalImageSrc}
              alt={previewImageAlt}
              width={width}
              height={height}
              className="h-full w-full object-cover"
              sizes={`${width}px`}
              unoptimized={isExternalPreview}
              onError={() => {
                if (!imageError && finalImageSrc !== rootFallbackSrc) {
                  setImageError(true);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </span>
  );
}

export default LinkPreview;
