"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  minuteLabel,
  resolveStatusSlot,
  type PublicStatusSlot,
} from "../lib/status-schedule";

interface Props {
  schedule: PublicStatusSlot[];
  timezone: string;
  initialNow: string;
}

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 30000);
  return () => window.clearInterval(timer);
}

function getClockSnapshot() {
  return Math.floor(Date.now() / 30000);
}

export function NowRoutine({ schedule, timezone, initialNow }: Props) {
  const locale = useLocale();
  const t = useTranslations("main.now.activity");
  const tick = useSyncExternalStore(subscribeToClock, getClockSnapshot, () =>
    Math.floor(Date.parse(initialNow) / 30000),
  );

  const now = new Date(tick * 30000);
  const active = resolveStatusSlot(schedule, timezone, now);

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const minute =
    Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  const ranges: [number, number][] = !active
    ? []
    : active.startMinute === active.endMinute
      ? [[0, 1440]]
      : active.startMinute < active.endMinute
        ? [[active.startMinute, active.endMinute]]
        : [
            [active.startMinute, 1440],
            [0, active.endMinute],
          ];

  const inWindow = Boolean(active);
  const leftPercent = (minute / 14.4).toFixed(2);

  return (
    <div className="mt-10 sm:mt-12">
      {/* Big Mono Clock */}
      <time
        dateTime={now.toISOString()}
        className="text-foreground block font-mono text-[clamp(3rem,9vw,6.5rem)] leading-none font-semibold tracking-tighter tabular-nums"
      >
        {new Intl.DateTimeFormat(locale, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        }).format(now)}
      </time>

      {/* Timezone Location */}
      <p className="text-muted-foreground mt-3 font-mono text-xs sm:text-sm">
        {timezone.replaceAll("_", " ")}
      </p>

      {/* 24-Hour Routine Track */}
      <div className="mx-auto mt-9 max-w-xl px-4" aria-hidden>
        <div className="bg-border relative h-1 rounded-full">
          {ranges.map(([start, end]) => (
            <span
              key={start}
              className="bg-primary/70 absolute inset-y-0 rounded-full"
              style={{
                left: `${(start / 14.4).toFixed(2)}%`,
                width: `${((end - start) / 14.4).toFixed(2)}%`,
              }}
            />
          ))}
          {/* Active Minute Indicator Pin */}
          <span
            className="bg-foreground ring-background absolute -top-1.5 h-4 w-1 -translate-x-1/2 rounded-full shadow-sm ring-2"
            style={{ left: `${leftPercent}%` }}
          />
        </div>

        {/* 24h Ticks */}
        <div className="text-muted-foreground mt-2.5 flex justify-between font-mono text-xs">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>

      {/* Current Routine Status Text */}
      {active ? (
        <p className="text-muted-foreground mx-auto mt-6 max-w-md text-base leading-relaxed sm:text-lg">
          {t("routineAround")}{" "}
          <b className="text-foreground font-semibold">{active.body}</b>
          <small className="text-muted-foreground/80 mt-1.5 block font-mono text-xs">
            {t("routineUsual", {
              start: minuteLabel(active.startMinute),
              end: minuteLabel(active.endMinute),
            })}{" "}
            ·{" "}
            <span className={inWindow ? "text-primary font-medium" : ""}>
              {inWindow ? t("routineInWindow") : t("routineOutsideWindow")}
            </span>
          </small>
        </p>
      ) : null}
    </div>
  );
}
