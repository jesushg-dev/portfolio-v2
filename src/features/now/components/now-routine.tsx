"use client";
import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { minuteLabel, resolveStatusSlot, type PublicStatusSlot } from "../lib/status-schedule";
interface Props { schedule: PublicStatusSlot[]; timezone: string; initialNow: string; }
function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 30000);
  return () => window.clearInterval(timer);
}
function getClockSnapshot() { return Math.floor(Date.now() / 30000); }
export function NowRoutine({ schedule, timezone, initialNow }: Props) {
  const locale = useLocale();
  const t = useTranslations("main.now.activity");
  const tick = useSyncExternalStore(subscribeToClock, getClockSnapshot, () => Math.floor(Date.parse(initialNow) / 30000));
  const now = new Date(tick * 30000);
  const active = resolveStatusSlot(schedule, timezone, now);
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const minute = Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60 + Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const ranges: [number, number][] = !active ? [] : active.startMinute === active.endMinute ? [[0,1440]]
    : active.startMinute < active.endMinute ? [[active.startMinute, active.endMinute]]
    : [[active.startMinute,1440],[0,active.endMinute]];
  return (
    <div className="mt-16 md:mt-18">
      <time dateTime={now.toISOString()} className="text-foreground block font-mono text-[clamp(3.5rem,12vw,9.25rem)] leading-none font-semibold tracking-tighter tabular-nums">
        {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(now)}
      </time>
      <p className="text-muted-foreground mt-4 font-mono text-xs">{timezone.replaceAll("_", " ")}</p>
      <div className="mx-auto mt-11 max-w-xl" aria-hidden>
        <div className="bg-border relative h-0.5 rounded-full">
          {ranges.map(([start,end]) => <span key={start} className="bg-primary/60 absolute inset-y-0 rounded-full"
            style={{ left: String(start / 14.4) + "%", width: String((end-start) / 14.4) + "%" }} />)}
          <span className="bg-foreground ring-background absolute -top-1.5 h-3.5 w-0.5 -translate-x-1/2 rounded-full ring-4" style={{ left: String(minute / 14.4) + "%" }} />
        </div>
        <div className="text-muted-foreground mt-3 flex justify-between font-mono text-xs">
          {["00","06","12","18","24"].map((hour) => <span key={hour}>{hour}</span>)}
        </div>
      </div>
      {active?.body ? <div className="mx-auto mt-7 max-w-lg">
        <p className="text-foreground text-lg"><span aria-hidden className="mr-2">{active.emoji}</span>{t("routineNow", { activity: active.body })}</p>
        <p className="text-muted-foreground mt-2 font-mono text-xs">{t("scheduledHours", { start: minuteLabel(active.startMinute), end: minuteLabel(active.endMinute), timezone })}</p>
      </div> : null}
    </div>
  );
}
