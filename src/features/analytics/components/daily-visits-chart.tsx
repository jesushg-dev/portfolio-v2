"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

import type { DailyVisitPoint } from "@/features/analytics/lib/summarize";

interface DailyVisitsChartProps {
  dailyVisits?: DailyVisitPoint[];
  totalVisits: number;
}

export function DailyVisitsChart({
  dailyVisits = [],
  totalVisits,
}: DailyVisitsChartProps) {
  const locale = useLocale();

  const { days, peakIndex, startDate, endDate } = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    });

    if (dailyVisits.length > 0) {
      const parsedDays = dailyVisits.map((item) => {
        // parse YYYY-MM-DD safely
        const [year, month, day] = item.date.split("-").map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        return {
          visits: item.visits,
          formattedDate: formatter.format(dateObj),
        };
      });

      const max = Math.max(1, ...parsedDays.map((d) => d.visits));
      const peakIdx = parsedDays.findIndex((d) => d.visits === max);

      return {
        days: parsedDays.map((d) => ({
          ...d,
          heightPercent:
            d.visits > 0 ? Math.max(4, Math.round((d.visits / max) * 100)) : 2,
        })),
        peakIndex: max > 1 ? peakIdx : -1,
        maxVisits: max,
        startDate: parsedDays[0]?.formattedDate ?? "",
        endDate: parsedDays[parsedDays.length - 1]?.formattedDate ?? "",
      };
    }

    // If no daily data available yet: 30 empty/subtle bars
    const N = 30;
    const now = new Date();
    const dates = Array.from({ length: N }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (N - 1) + i);
      return d;
    });

    return {
      days: dates.map((d) => ({
        visits: 0,
        formattedDate: formatter.format(d),
        heightPercent: 2,
      })),
      peakIndex: -1,
      maxVisits: 0,
      startDate: formatter.format(dates[0]),
      endDate: formatter.format(dates[N - 1]),
    };
  }, [dailyVisits, locale]);

  const peakDay = peakIndex >= 0 ? days[peakIndex] : null;

  return (
    <div className="mt-20">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {locale === "es"
            ? "Visitas por día"
            : locale === "nl"
              ? "Bezoeken per dag"
              : "Visits per day"}
        </h2>
      </div>
      <p className="text-muted-foreground mt-2 mb-7 text-sm sm:text-base">
        {locale === "es"
          ? `Últimos 30 días · ${totalVisits.toLocaleString(locale)} visitas en total.`
          : locale === "nl"
            ? `Laatste 30 dagen · ${totalVisits.toLocaleString(locale)} bezoeken in totaal.`
            : `Last 30 days · ${totalVisits.toLocaleString(locale)} total visits.`}
      </p>

      {/* Bars container */}
      <div
        role="img"
        aria-label="Visits per day chart"
        className="border-border/80 flex h-48 items-end gap-1 border-b pb-0.5 sm:gap-1.5"
      >
        {days.map((day, idx) => {
          const isPeak = idx === peakIndex && day.visits > 0;
          return (
            <div
              key={day.formattedDate + idx}
              title={`${day.formattedDate}: ${day.visits} ${
                locale === "es"
                  ? "visitas"
                  : locale === "nl"
                    ? "bezoeken"
                    : "visits"
              }`}
              style={{ height: `${day.heightPercent}%` }}
              className={`flex-1 rounded-t-xs transition-colors ${
                isPeak
                  ? "bg-primary"
                  : day.visits > 0
                    ? "bg-primary/50 hover:bg-primary"
                    : "bg-border/60 hover:bg-border"
              }`}
            />
          );
        })}
      </div>

      {/* Date Axis */}
      <div className="text-muted-foreground mt-2.5 flex justify-between font-mono text-xs">
        <span>{startDate}</span>
        <span>{endDate}</span>
      </div>

      {/* Peak Info Note */}
      {peakDay && peakDay.visits > 0 ? (
        <p className="text-muted-foreground mt-3.5 text-xs sm:text-sm">
          {locale === "es"
            ? `Pico: ${peakDay.visits} visitas el ${peakDay.formattedDate}.`
            : locale === "nl"
              ? `Piek: ${peakDay.visits} bezoeken op ${peakDay.formattedDate}.`
              : `Peak: ${peakDay.visits} visits on ${peakDay.formattedDate}.`}
        </p>
      ) : null}
    </div>
  );
}
