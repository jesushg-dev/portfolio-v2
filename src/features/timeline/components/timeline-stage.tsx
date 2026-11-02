"use client";

import { type FC } from "react";
import type { TimelineCategory } from "@prisma/client";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";
import {
  formatTimelineRange,
  calculateTimelineDuration,
  getOrganizationInitials,
} from "@/features/timeline/lib/timeline-format";

export interface TimelineStageProps {
  activeItem: TimelinePublicItem | undefined;
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  categoryLabels: Record<TimelineCategory, string>;
  imageOfLabel: (current: number, total: number) => string;
  presentLabel: string;
}

export const TimelineStage: FC<TimelineStageProps> = ({
  activeItem,
  activeImageIndex,
  onSelectImage,
  categoryLabels,
  imageOfLabel,
  presentLabel,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (!activeItem) {
    return null;
  }

  const initials = getOrganizationInitials(activeItem.organization);
  const images = activeItem.images;
  const currentImageUrl = images[activeImageIndex] ?? images[0];
  const dateRange = formatTimelineRange({
    startDate: activeItem.startDate,
    endDate: activeItem.endDate,
    current: activeItem.current,
    presentLabel,
  });
  const duration = calculateTimelineDuration(
    activeItem.startDate,
    activeItem.endDate,
    activeItem.current,
  );

  return (
    <aside className="hidden lg:block" aria-label="Milestone visual stage">
      <div className="sticky top-24">
        <div className="relative">
          {/* Ambient Breathing Glow */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    opacity: [0.35, 0.55, 0.35],
                    scale: [0.98, 1.02, 0.98],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="from-primary/25 via-accent/15 absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br to-transparent blur-2xl"
            aria-hidden="true"
          />

          {/* Main Stage Window */}
          <div className="border-border bg-card relative h-[min(34rem,calc(100vh-12rem))] overflow-hidden rounded-[2rem] border shadow-2xl">
            {/* Background Initials Art (Fallback & Accent) with smooth crossfade */}
            <div className="from-primary/25 via-accent/15 to-card absolute inset-0 flex items-center justify-center bg-gradient-to-br">
              <AnimatePresence mode="wait">
                <motion.span
                  key={initials}
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.85 }}
                  animate={{ opacity: 0.2, scale: 1 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.15 }}
                  transition={{ duration: shouldReduceMotion ? 0.15 : 0.35 }}
                  className="text-foreground text-[8rem] leading-none font-black select-none"
                  aria-hidden="true"
                >
                  {initials}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Photo / Renderable media with spring crossfade */}
            {currentImageUrl ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeItem.id}-${activeImageIndex}`}
                  initial={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 0.96,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 1.04,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0.15 : 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0"
                >
                  <MediaImage
                    src={currentImageUrl}
                    alt={`${activeItem.organization} - ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 1280px) 40vw, 520px"
                    className="object-cover"
                    preload
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}

            {/* Top-Left Category Pill */}
            <AnimatePresence mode="wait">
              <motion.span
                key={activeItem.id + activeItem.category}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                transition={{ duration: shouldReduceMotion ? 0.15 : 0.25 }}
                className="bg-background/85 text-foreground border-border/40 absolute top-5 left-5 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-xs backdrop-blur-md"
              >
                {categoryLabels[activeItem.category] ?? activeItem.category}
              </motion.span>
            </AnimatePresence>

            {/* Top-Right Org Monogram */}
            <AnimatePresence mode="wait">
              <motion.span
                key={initials}
                initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.7 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-background/85 text-primary border-border/40 absolute top-5 right-5 flex size-12 items-center justify-center rounded-2xl border text-sm font-black shadow-xs backdrop-blur-md"
                aria-label={activeItem.organization}
              >
                {initials}
              </motion.span>
            </AnimatePresence>

            {/* Bottom Details Overlay */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                transition={{
                  duration: shouldReduceMotion ? 0.15 : 0.35,
                  ease: "easeOut",
                }}
                className="from-background/95 via-background/60 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-6 pt-24"
              >
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {dateRange}
                  {duration ? ` · ${duration}` : ""}
                </p>
                <h3 className="text-foreground mt-1 text-2xl font-black tracking-tight">
                  {activeItem.organization}
                </h3>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm font-medium">
                  {activeItem.title}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Thumbnails row (multi-image) with hover/tap motion */}
        {images.length > 1 ? (
          <div className="mt-4 flex min-h-14 items-center gap-3">
            {images.map((img, idx) => {
              const isSelected = idx === activeImageIndex;
              return (
                <motion.button
                  key={img}
                  type="button"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
                  onClick={() => onSelectImage(idx)}
                  className={cn(
                    "border-border relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 focus:outline-hidden",
                    isSelected
                      ? "ring-primary ring-offset-background shadow-md ring-2 ring-offset-2"
                      : "opacity-60 hover:opacity-100",
                  )}
                  aria-pressed={isSelected}
                  aria-label={imageOfLabel(idx + 1, images.length)}
                >
                  <MediaImage
                    src={img}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </motion.button>
              );
            })}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
