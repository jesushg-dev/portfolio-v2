"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Flag, MoveUpRight } from "lucide-react";
import { usePublicCvVisible } from "@/components/app-layout/public-cv-visible";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  getCareerMilestones,
  getCareerMonths,
  type CareerExperience,
} from "./career-timeline";

interface CareerClimbChartProps {
  experiences: CareerExperience[];
  viewAllLabel: string;
  referenceDate: Date;
  nextStage?: { title: string; description: string } | null;
}

const NEXT_STAGE_ID = "career-next-stage";

export function CareerClimbChart({
  experiences,
  viewAllLabel,
  referenceDate,
  nextStage,
}: CareerClimbChartProps) {
  const t = useTranslations("main.experience");
  const id = useId();
  const showCvLink = usePublicCvVisible();
  const pointRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const milestones = getCareerMilestones(experiences);
  const ordered = [
    ...milestones.map(({ experience }) => experience),
    ...experiences.filter(
      (experience) =>
        !milestones.some((point) => point.experience.id === experience.id),
    ),
  ];
  const choices = [
    ...ordered.map((item) => item.id),
    ...(nextStage ? [NEXT_STAGE_ID] : []),
  ];
  const [selection, setSelection] = useState<string | null>(null);
  const defaultId = ordered.at(-1)?.id ?? NEXT_STAGE_ID;
  const selectedIndex = Math.max(
    0,
    choices.findIndex((choice) => choice === (selection ?? defaultId)),
  );
  const selectedId = choices[selectedIndex];
  const selected = ordered.find((item) => item.id === selectedId);
  const selectedNextStage = selectedId === NEXT_STAGE_ID && nextStage;
  const selectedPoint = milestones.find(
    (point) => point.experience.id === selectedId,
  );
  const earliest = milestones[0]?.experience.startDate;
  const recordedDates = experiences.flatMap((item) => {
    const date = item.current ? referenceDate : item.endDate;
    return date && Number.isFinite(date.getTime())
      ? [Math.min(date.getTime(), referenceDate.getTime())]
      : [];
  });
  const timelineEnd = Math.max(
    earliest?.getTime() ?? 0,
    ...recordedDates,
    ...milestones.map((point) => point.experience.startDate!.getTime()),
  );
  const timelineStart = earliest?.getTime() ?? timelineEnd;
  const endX = nextStage ? 78 : 92;
  const points = milestones.map((point) => ({
    ...point,
    x:
      timelineEnd === timelineStart
        ? 50
        : 8 +
          ((point.experience.startDate!.getTime() - timelineStart) /
            (timelineEnd - timelineStart)) *
            (endX - 8),
  }));
  const first = points[0];
  const last = points.at(-1);
  const milestonePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const path =
    last && timelineEnd > (last.experience.startDate?.getTime() ?? timelineEnd)
      ? `${milestonePath} L${endX} ${last.y}`
      : milestonePath;
  const pathEndX =
    last && timelineEnd > (last.experience.startDate?.getTime() ?? timelineEnd)
      ? endX
      : last?.x;
  const months = getCareerMonths(experiences, referenceDate);
  const finalYear = earliest
    ? new Date(timelineEnd).getUTCFullYear()
    : undefined;
  const activePoint = points.find(
    (point) => point.experience.id === selectedPoint?.experience.id,
  );

  function handlePointKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const plotIds = [
      ...points.map((point) => point.experience.id),
      ...(nextStage ? [NEXT_STAGE_ID] : []),
    ];
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = Math.min(index + 1, plotIds.length - 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = Math.max(index - 1, 0);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = plotIds.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextId = plotIds[nextIndex];
    setSelection(nextId);
    pointRefs.current[nextId]?.focus();
  }

  if (choices.length === 0) return null;

  return (
    <div className="border-border/70 from-card via-card to-primary/5 overflow-hidden rounded-3xl border bg-linear-to-br shadow-xl">
      <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                {t("chart.eyebrow")}
              </p>
              <p className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("chart.title")}
              </p>
            </div>
            {months > 0 ? (
              <div className="text-right">
                <p className="text-primary text-4xl font-semibold tracking-tighter tabular-nums sm:text-5xl">
                  {months}
                </p>
                <p className="text-muted-foreground mt-1 max-w-36 text-xs leading-relaxed">
                  {t("chart.monthsShown")}
                </p>
              </div>
            ) : null}
          </div>

          {points.length > 0 ? (
            <>
              <div
                className="relative mt-8 aspect-[25/12] w-full"
                role="group"
                aria-label={t("chart.ariaLabel")}
              >
                <svg
                  viewBox="0 0 100 48"
                  aria-hidden="true"
                  className="absolute inset-0 size-full overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id={`${id}-fill`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity="0.28"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity="0.01"
                      />
                    </linearGradient>
                  </defs>
                  {[10, 24, 38].map((y) => (
                    <path
                      key={y}
                      d={`M8 ${y} H92`}
                      stroke="var(--border)"
                      strokeWidth="0.15"
                      strokeDasharray="0.5 1"
                      fill="none"
                    />
                  ))}
                  <path
                    d={`${path} L${pathEndX} 44 L${first.x} 44 Z`}
                    fill={`url(#${id}-fill)`}
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {nextStage && last ? (
                    <path
                      d={`M${pathEndX} ${last.y} Q87 10 94 5`}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="0.35"
                      strokeDasharray="1 1"
                      opacity="0.6"
                    />
                  ) : null}
                  {activePoint ? (
                    <path
                      d={`M${activePoint.x} ${activePoint.y} V44`}
                      stroke="var(--primary)"
                      strokeWidth="0.2"
                      strokeDasharray="0.7 0.7"
                    />
                  ) : null}
                </svg>
                {points.map((point, index) => (
                  <button
                    key={point.experience.id}
                    type="button"
                    ref={(node) => {
                      pointRefs.current[point.experience.id] = node;
                    }}
                    onClick={() => setSelection(point.experience.id)}
                    onKeyDown={(event) => handlePointKeyDown(event, index)}
                    aria-label={`${point.experience.company} · ${point.experience.role} · ${point.experience.dates}`}
                    aria-pressed={point.experience.id === selectedId}
                    aria-controls={`${id}-detail`}
                    style={{
                      left: `${point.x}%`,
                      top: `${(point.y / 48) * 100}%`,
                    }}
                    className="group focus-visible:ring-ring absolute z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "border-primary bg-card size-3 rounded-full border-2 shadow-sm transition-transform group-hover:scale-125",
                        point.experience.id === selectedId &&
                          "bg-primary ring-primary/15 size-4 ring-8",
                      )}
                    />
                    <span
                      className={cn(
                        "text-muted-foreground absolute top-10 hidden max-w-24 truncate text-center text-xs font-medium sm:block",
                        point.experience.id === selectedId &&
                          "text-primary font-semibold",
                      )}
                    >
                      {point.experience.company}
                    </span>
                  </button>
                ))}
                {nextStage ? (
                  <button
                    type="button"
                    ref={(node) => {
                      pointRefs.current[NEXT_STAGE_ID] = node;
                    }}
                    aria-label={`${t("chart.nextStage")}: ${nextStage.title}`}
                    aria-pressed={Boolean(selectedNextStage)}
                    aria-controls={`${id}-content`}
                    onClick={() => setSelection(NEXT_STAGE_ID)}
                    onKeyDown={(event) =>
                      handlePointKeyDown(event, points.length)
                    }
                    style={{ left: "94%", top: `${(5 / 48) * 100}%` }}
                    className="text-primary bg-primary/10 focus-visible:ring-ring hover:bg-primary/20 absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <Flag className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="text-muted-foreground mt-5 flex justify-between gap-4 font-mono text-xs tabular-nums">
                <span>{earliest?.getUTCFullYear()}</span>
                <span>{finalYear}</span>
              </div>
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                {t("chart.caption")}
              </p>
            </>
          ) : null}

          {months > 0 ? (
            <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
              {t("chart.monthsExplanation")}
            </p>
          ) : null}
        </div>

        <section
          id={`${id}-detail`}
          aria-labelledby={`${id}-detail-heading`}
          className="border-border/70 bg-background/50 flex min-w-0 flex-col border-t p-5 sm:p-8 lg:border-t-0 lg:border-l lg:p-10"
        >
          <div
            id={`${id}-content`}
            aria-live="polite"
            aria-atomic="true"
            className="flex-1"
          >
            {selectedNextStage ? (
              <div className="flex h-full flex-col items-start justify-center">
                <span className="bg-primary/10 text-primary mb-6 flex size-14 items-center justify-center rounded-2xl">
                  <Flag className="size-6" aria-hidden="true" />
                </span>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  {t("chart.nextStage")}
                </p>
                <h3
                  id={`${id}-detail-heading`}
                  className="text-foreground mt-3 text-3xl font-semibold tracking-tight"
                >
                  {selectedNextStage.title}
                </h3>
                <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                  {selectedNextStage.description}
                </p>
                <a
                  href="#contact"
                  className="btn-primary-glow focus-visible:ring-ring mt-8 inline-flex min-h-11 items-center gap-3 rounded-full px-6 py-2.5 text-sm font-bold focus-visible:ring-2"
                >
                  {t("chart.letsTalk")}
                  <MoveUpRight className="size-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            ) : selected ? (
              <>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  {selected.company}
                </p>
                <h3
                  id={`${id}-detail-heading`}
                  className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {selected.role}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm font-medium tabular-nums">
                  {selected.dates}
                </p>
                {selected.responsibilities.length > 0 ? (
                  <ul className="text-muted-foreground mt-7 space-y-4 text-sm leading-relaxed">
                    {selected.responsibilities.map((responsibility, index) => (
                      <li
                        key={`${selected.id}-${index}`}
                        className="border-primary/30 border-l-2 pl-4"
                      >
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {selected.skills?.length ? (
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {selected.skills.map((skill) => (
                      <li
                        key={skill}
                        className="border-border bg-muted/40 text-foreground rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showCvLink ? (
                  <Link
                    href="/curriculum-vitae"
                    className="text-primary focus-visible:ring-ring mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline focus-visible:ring-2"
                  >
                    {viewAllLabel}
                    <MoveUpRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            ) : null}
          </div>
          <div
            role="group"
            aria-label={t("chart.selectRole")}
            className="border-border/70 mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="btn-glass min-h-11 rounded-full px-4"
              disabled={selectedIndex === 0}
              onClick={() => setSelection(choices[selectedIndex - 1])}
              aria-controls={`${id}-content`}
            >
              <ArrowLeft aria-hidden="true" />
              {t("chart.previous")}
            </Button>
            <span
              className="text-muted-foreground text-xs tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedIndex + 1} / {choices.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="btn-glass min-h-11 max-w-full rounded-full px-4"
              disabled={selectedIndex === choices.length - 1}
              onClick={() => setSelection(choices[selectedIndex + 1])}
              aria-controls={`${id}-content`}
            >
              <span className="text-left whitespace-normal">
                {nextStage && selectedIndex === ordered.length - 1
                  ? `${t("chart.nextStage")}: ${nextStage.title}`
                  : t("chart.next")}
              </span>
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
