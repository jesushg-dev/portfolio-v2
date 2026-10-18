"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { MediaImage } from "@/components/shared/media-image";
import { ImageLightbox } from "@/components/shared/image-lightbox";
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

  const openLightbox = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

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
          "group border-border bg-muted focus-visible:ring-primary relative mt-4 block w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="bg-background/90 text-foreground border-border/80 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-xs">
            <Maximize2 className="text-primary size-3.5" />
            <span>{t("expandImage") || "Ampliar imagen"}</span>
          </span>
        </div>
      </button>

      <ImageLightbox
        isOpen={isOpen}
        onClose={closeLightbox}
        src={src}
        alt={alt}
        title={alt}
        subtitle={t("pressEscToClose") || "Presiona Esc para cerrar"}
        closeAriaLabel={t("closeLightbox") || "Cerrar imagen ampliada"}
      />
    </>
  );
}
