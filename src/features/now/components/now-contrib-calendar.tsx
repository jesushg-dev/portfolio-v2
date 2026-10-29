"use client";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ReadyGitHubContributions } from "../lib/github-contributions";
const shades = [
  "bg-muted",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
];

export default function NowContribCalendar({
  calendar,
}: {
  calendar: ReadyGitHubContributions;
}) {
  const locale = useLocale();
  const reducedMotion = useReducedMotion();
  const t = useTranslations("main.now.activity");
  const monthMarkers = calendar.weeks
    .flatMap((week, index) => {
      const first =
        index === 0 ? week[0] : week.find((day) => day.date.endsWith("-01"));
      return first ? [{ index, date: first.date }] : [];
    })
    .filter(
      (marker, index, markers) =>
        index !== 0 || !markers[1] || markers[1].index - marker.index >= 3,
    );
  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-3">
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain py-2">
        <div
          className="grid w-full min-w-[42rem] gap-1"
          style={{
            gridTemplateColumns:
              "repeat(" +
              Math.max(1, calendar.weeks.length) +
              ", minmax(0, 1fr))",
          }}
          role="img"
          aria-label={t("contributionsTotal", {
            total: calendar.total.toLocaleString(locale),
          })}
        >
          {calendar.weeks.map((week, index) => {
            const marker = monthMarkers.find((item) => item.index === index);
            return (
              <div key={week[0]?.date ?? index} className="min-w-0">
                <div className="relative mb-2 h-4">
                  {marker ? (
                    <span className="text-muted-foreground absolute top-0 left-0 text-xs whitespace-nowrap">
                      {new Intl.DateTimeFormat(locale, {
                        month: "short",
                        timeZone: "UTC",
                      }).format(new Date(marker.date + "T12:00:00Z"))}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-rows-7 gap-1">
                  {week.map((day) => (
                    <motion.span
                      key={day.date}
                      style={{ gridRow: day.weekday + 1 }}
                      whileHover={reducedMotion ? undefined : { scale: 0.88 }}
                      transition={{
                        type: "tween",
                        ease: "easeOut",
                        duration: 0.15,
                      }}
                      className={cn(
                        "relative block aspect-square w-full rounded-xs",
                        shades[day.level],
                      )}
                      title={t("contributionDay", {
                        count: day.count,
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "long",
                          timeZone: "UTC",
                        }).format(new Date(day.date + "T12:00:00Z")),
                      })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-muted-foreground flex items-center justify-end gap-1.5 text-xs">
        <span>{t("less")}</span>
        {shades.map((shade) => (
          <span key={shade} className={cn("size-3 rounded-xs", shade)} />
        ))}
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
