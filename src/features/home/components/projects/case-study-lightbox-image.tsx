"use client";

import { useEffect, useState, useCallback, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";

interface CaseStudyLightboxImageProps {
  src: string;
  alt: string;
  aspectClassName?: string;
  className?: string;
  sizes?: string;
}

export function CaseStudyLightboxImage({
  src,
  alt,
  aspectClassName = "aspect-[2/1]",
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: CaseStudyLightboxImageProps) {
  const t = useTranslations("main.portfolio.caseStudy");
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openLightbox = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePreviewKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        onKeyDown={handlePreviewKeyDown}
        aria-label={`${t("expandImage") || "Ampliar imagen"}: ${alt}`}
        className={cn(
          "group border-border bg-muted relative mt-4 block w-full overflow-hidden rounded-2xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          aspectClassName,
          className,
        )}
      >
        <MediaImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay hint */}
        <div className="bg-black/50 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="bg-background/90 text-foreground border-border/80 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-xs">
            <Maximize2 className="size-3.5 text-primary" />
            <span>{t("expandImage") || "Ampliar imagen"}</span>
          </span>
        </div>
      </button>

      {/* Lightbox Modal Portal */}
      {isOpen && isMounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={closeLightbox}
              className="bg-black/90 fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-md animate-in fade-in-0 duration-200"
            >
              {/* Header Bar */}
              <div
                className="flex w-full items-center justify-between gap-4 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/90 sm:text-base">
                    {alt}
                  </p>
                  <p className="text-xs text-white/60">
                    {t("pressEscToClose") || "Presiona Esc para cerrar"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label={t("closeLightbox") || "Cerrar imagen ampliada"}
                  className="size-11 sm:size-12 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Main Expanded Image View */}
              <div
                className="relative flex flex-1 w-full max-w-6xl items-center justify-center overflow-hidden my-2"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[78vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                />
              </div>

              {/* Footer hint */}
              <div
                className="w-full text-center py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[0.6875rem] uppercase tracking-wider text-white/50">
                  {alt}
                </span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
