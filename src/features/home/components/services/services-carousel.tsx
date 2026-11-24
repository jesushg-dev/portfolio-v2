"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { ExpertiseVisual } from "./expertise-visual";

export type ExpertiseItem =
  RouterOutputs["portfolio"]["getServicesPublic"][number];

type ServicesTranslations = ReturnType<typeof useTranslations<"main.services">>;

export function ServicesCarousel({
  dbServices,
}: {
  dbServices: ExpertiseItem[];
}) {
  const t = useTranslations("main.services");
  const triggerRef = useRef<HTMLElement | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [selected, setSelected] = useState<ExpertiseItem | null>(null);

  if (dbServices.length === 0) return null;

  const hasWideSpotlight = dbServices.length > 3 && dbServices.length % 3 === 1;

  return (
    <>
      <section
        aria-label={t("title")}
        className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20"
      >
        <div className="mb-5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-card min-h-11 gap-2 rounded-full px-4 text-sm font-medium"
            aria-label={t(motionPaused ? "resumeMotion" : "pauseMotion")}
            onClick={() => setMotionPaused((previous) => !previous)}
          >
            {motionPaused ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
            <span>{t(motionPaused ? "resumeMotion" : "pauseMotion")}</span>
          </Button>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {dbServices.map((item, index) => (
            <ExpertiseCard
              key={item.id}
              item={item}
              paused={motionPaused}
              wide={hasWideSpotlight && index === dbServices.length - 1}
              t={t}
              onSelect={(next, triggerEl) => {
                triggerRef.current = triggerEl;
                setSelected(next);
              }}
            />
          ))}
        </ul>
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
  wide,
  t,
}: {
  item: ExpertiseItem;
  paused: boolean;
  wide: boolean;
  t: ServicesTranslations;
  onSelect: (item: ExpertiseItem, triggerEl: HTMLElement) => void;
}) {
  return (
    <li className={cn(wide && "md:col-span-2 lg:col-span-3")}>
      <button
        type="button"
        onClick={(e) => onSelect(item, e.currentTarget)}
        className={cn(
          "home-card-surface home-card-surface-interactive bg-card group flex h-full w-full cursor-pointer overflow-hidden rounded-[1.75rem] text-left transition-all duration-300 motion-safe:hover:-translate-y-1",
          wide
            ? "min-h-[18rem] flex-col md:grid md:grid-cols-[1.05fr_1fr] md:items-center"
            : "min-h-[25rem] flex-col",
        )}
      >
        <span className="sr-only">
          {t("viewDetails", { title: item.title })}
        </span>
        <div
          className={cn(
            "w-full px-6 pt-6 sm:px-7 sm:pt-7",
            wide && "md:py-8 md:pr-4",
          )}
        >
          {item.badge && (
            <span className="text-primary mb-2 block text-sm font-semibold tracking-wider uppercase">
              {item.badge}
            </span>
          )}
          <h3 className="text-foreground text-2xl leading-[1.15] font-bold tracking-[-0.025em]">
            {item.title}
          </h3>
          <p className="text-foreground/80 mt-3 line-clamp-3 text-base leading-relaxed">
            {item.description}
          </p>
        </div>
        <div
          className={cn(
            "relative h-[14.5rem] w-full p-4",
            wide ? "mt-auto md:mt-0 md:h-[16.5rem]" : "mt-auto",
          )}
        >
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
      <div className="text-foreground/75 flex items-center justify-between px-5 pt-4 sm:px-7">
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
          <DialogDescription className="text-foreground/85 mt-3 text-base leading-relaxed">
            {item.description}
          </DialogDescription>
          {item.practicePoints.length > 0 && (
            <div className="mt-6">
              <h4 className="text-foreground/80 text-sm font-semibold tracking-widest uppercase">
                {t("inPractice")}
              </h4>
              <ul className="text-foreground marker:text-primary mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed sm:text-base">
                {item.practicePoints.map((point, idx) => (
                  <li key={`${idx}-${point}`}>{point}</li>
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
                  className="border-border text-foreground/85 rounded-full border px-3 py-1 text-sm"
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
