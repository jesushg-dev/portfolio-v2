"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Pause, Play, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpertiseVisual } from "./expertise-visual";
import type { RouterOutputs } from "@/trpc/react";

export type ExpertiseItem =
  RouterOutputs["portfolio"]["getServicesPublic"][number];

type ServicesTranslations = ReturnType<typeof useTranslations<"main.services">>;

export function ServicesCarousel({
  dbServices,
}: {
  dbServices: ExpertiseItem[];
}) {
  const t = useTranslations("main.services");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [selected, setSelected] = useState<ExpertiseItem | null>(null);
  const [railInset, setRailInset] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const heading = document.getElementById("services-heading");
    if (!heading) return;
    const measure = () =>
      setRailInset(Math.max(0, heading.getBoundingClientRect().left));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      const progress = el.scrollLeft / maxScroll;
      setActiveIndex(
        Math.min(
          dbServices.length - 1,
          Math.max(0, Math.round(progress * (dbServices.length - 1))),
        ),
      );
    }
  }, [dbServices.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [dbServices, updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: direction * el.clientWidth,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  if (dbServices.length === 0) return null;

  return (
    <>
      <section aria-label={t("title")} aria-roledescription="carousel">
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          tabIndex={0}
          aria-label={t("carouselInstructions")}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              scroll(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
          style={
            railInset === null
              ? undefined
              : { scrollPaddingInline: `${railInset}px` }
          }
          className="focus-visible:ring-ring snap-x snap-mandatory scroll-pl-4 [scrollbar-width:none] overflow-x-auto overscroll-x-contain py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset sm:scroll-pl-6 lg:scroll-pl-20 [&::-webkit-scrollbar]:hidden"
        >
          <ul
            style={
              railInset === null
                ? undefined
                : { paddingInline: `${railInset}px` }
            }
            className="flex w-max items-stretch gap-5 px-4 sm:px-6 lg:px-20"
          >
            {dbServices.map((item) => (
              <ExpertiseCard
                key={item.id}
                item={item}
                paused={motionPaused}
                t={t}
                onSelect={(next) => {
                  triggerRef.current = document.activeElement as HTMLElement;
                  setSelected(next);
                }}
              />
            ))}
          </ul>
        </div>
        <div
          style={
            railInset === null ? undefined : { paddingInline: `${railInset}px` }
          }
          className="mt-5 flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-20"
        >
          {/* Counter 01 / 07 */}
          <span className="text-muted-foreground mr-1 font-mono text-sm whitespace-nowrap tabular-nums select-none">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(dbServices.length).padStart(2, "0")}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-card size-11 min-h-11 min-w-11 rounded-full"
            aria-label={t(motionPaused ? "resumeMotion" : "pauseMotion")}
            onClick={() => setMotionPaused((previous) => !previous)}
          >
            {motionPaused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("previousCard")}
            disabled={!canScrollLeft}
            onClick={() => scroll(-1)}
            className="bg-card size-11 min-h-11 min-w-11 rounded-full"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("nextCard")}
            disabled={!canScrollRight}
            onClick={() => scroll(1)}
            className="bg-card size-11 min-h-11 min-w-11 rounded-full"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </section>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          finalFocus={triggerRef}
          className="max-h-[90dvh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-4xl"
        >
          {selected && (
            <ExpertiseDetails
              item={selected}
              index={dbServices.findIndex((item) => item.id === selected.id)}
              total={dbServices.length}
              paused={motionPaused}
              t={t}
              onToggleMotion={() => setMotionPaused((previous) => !previous)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExpertiseCard({
  item,
  onSelect,
  paused,
  t,
}: {
  item: ExpertiseItem;
  paused: boolean;
  t: ServicesTranslations;
  onSelect: (item: ExpertiseItem) => void;
}) {
  return (
    <li className="w-[min(23.25rem,82vw)] flex-none snap-start">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="home-card-surface home-card-surface-interactive bg-card group flex h-full min-h-[30rem] w-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] text-left transition-all duration-300 motion-safe:hover:-translate-y-1"
      >
        <span className="sr-only">
          {t("viewDetails", { title: item.title })}
        </span>
        <div className="w-full px-7 pt-7">
          {item.badge && (
            <span className="text-primary mb-2 block text-sm font-semibold tracking-wider uppercase">
              {item.badge}
            </span>
          )}
          <h3 className="text-foreground text-[1.5625rem] leading-[1.15] font-bold tracking-[-0.025em]">
            {item.title}
          </h3>
          <p className="text-muted-foreground mt-3 line-clamp-3 text-[0.9375rem] leading-[1.45]">
            {item.description}
          </p>
        </div>
        <div className="relative mt-auto h-[15.625rem] w-full p-4">
          <ExpertiseVisual
            image={item.image}
            visualType={item.visualType}
            nodes={item.visualNodes}
            paused={paused}
          />
          <span
            aria-hidden="true"
            className="bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground absolute right-5 bottom-5 grid size-8 place-items-center rounded-full transition-colors"
          >
            <Plus className="size-4" />
          </span>
        </div>
      </button>
    </li>
  );
}

function ExpertiseDetails({
  item,
  index,
  total,
  paused,
  t,
  onToggleMotion,
}: {
  item: ExpertiseItem;
  index: number;
  total: number;
  paused: boolean;
  t: ServicesTranslations;
  onToggleMotion: () => void;
}) {
  return (
    <>
      <div className="text-muted-foreground flex items-center justify-between px-5 pt-4 sm:px-7">
        <span className="font-mono text-sm tabular-nums">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t(paused ? "resumeMotion" : "pauseMotion")}
            onClick={onToggleMotion}
          >
            {paused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
          <DialogClose
            render={
              <Button variant="ghost" size="icon" className="rounded-full" />
            }
            aria-label={t("close")}
          >
            <X className="size-4" />
          </DialogClose>
        </div>
      </div>
      <div className="grid items-center gap-7 px-5 pt-2 pb-7 md:grid-cols-[1fr_1.2fr] md:gap-9 md:px-8 md:pb-9">
        <div className="from-muted via-primary/5 to-primary/10 border-border/60 aspect-[4/3] overflow-hidden rounded-2xl border bg-linear-to-br p-3">
          <ExpertiseVisual
            image={item.image}
            visualType={item.visualType}
            nodes={item.visualNodes}
            paused={paused}
          />
        </div>
        <div className="min-w-0">
          {item.badge && (
            <p className="text-primary mb-2 text-sm font-semibold">
              {item.badge}
            </p>
          )}
          <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
            {item.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
            {item.description}
          </DialogDescription>
          {item.practicePoints.length > 0 && (
            <div className="mt-6">
              <h4 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                {t("inPractice")}
              </h4>
              <ul className="text-foreground marker:text-primary mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
                {item.practicePoints.map((point, index) => (
                  <li key={`${index}-${point}`}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          {item.statsValue && (
            <p className="text-primary mt-5 text-lg font-semibold">
              {item.statsValue} {item.statsLabel}
            </p>
          )}
          {item.technologies.length > 0 && (
            <ul
              aria-label={t("technologies")}
              className="mt-5 flex flex-wrap gap-2"
            >
              {item.technologies.map((tech) => (
                <li
                  key={tech.id}
                  className="border-border text-muted-foreground rounded-full border px-2.5 py-1 text-sm"
                >
                  {tech.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
