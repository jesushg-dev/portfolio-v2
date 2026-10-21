"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { MediaImage } from "@/components/shared/media-image";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  closeAriaLabel?: string;
  className?: string;
  imageClassName?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  src,
  alt,
  title,
  subtitle,
  footer,
  closeAriaLabel = "Cerrar",
  className,
  imageClassName,
}: ImageLightboxProps) {
  const isMounted = useMounted();

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : alt}
          className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 md:p-8"
        >
          {/* Frosted Backdrop */}
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="bg-background/80 fixed inset-0 backdrop-blur-xl"
          />

          {/* Modal Dialog Window */}
          <motion.div
            key="lightbox-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "border-border/70 bg-card/95 text-card-foreground ring-border/20 relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl ring-1 backdrop-blur-2xl",
              className,
            )}
          >
            {/* Header */}
            <div className="border-border/60 bg-muted/20 flex items-center justify-between border-b px-6 py-4">
              <div className="min-w-0 flex-1 pr-4">
                {title ? (
                  <div className="text-foreground truncate text-base font-bold tracking-tight sm:text-lg">
                    {title}
                  </div>
                ) : null}
                {subtitle ? (
                  <div className="text-muted-foreground mt-0.5 truncate text-xs sm:text-sm">
                    {subtitle}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeAriaLabel}
                className="border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-primary inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
              >
                <X className="size-4.5" aria-hidden="true" />
              </button>
            </div>

            {/* Credential Image Viewport */}
            <div className="bg-muted/10 relative flex max-h-[64vh] min-h-64 flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
              <div className="border-border/80 bg-background/95 ring-border/30 relative flex max-h-[58vh] max-w-full items-center justify-center rounded-2xl border p-2 shadow-2xl ring-1">
                <MediaImage
                  src={src}
                  alt={alt}
                  width={960}
                  height={640}
                  unoptimized
                  className={cn(
                    "h-auto max-h-[54vh] w-auto max-w-full rounded-xl object-contain drop-shadow-sm",
                    imageClassName,
                  )}
                />
              </div>
            </div>

            {/* Details & Actions Footer */}
            {footer ? (
              <div className="border-border/60 bg-card/70 border-t px-6 py-4 sm:px-7">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default ImageLightbox;
