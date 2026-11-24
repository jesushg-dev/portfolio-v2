"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pin } from "lucide-react";

import GlobeMapLazy from "./globe-map-lazy";

export interface OwnerMapLocation {
  lat: number;
  lon: number;
  label: string;
}

function cityLabel(place: string): string {
  const city = place.split(",")[0]?.trim();
  return city && city.length > 0 ? city : place;
}

function formatGmtOffset(timeZone: string, date: Date): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(date)
      .find((entry) => entry.type === "timeZoneName")?.value;
    if (!part) return "";
    return part === "GMT" ? "GMT+0" : part;
  } catch {
    return "";
  }
}

interface ContactGlobeProps {
  location: OwnerMapLocation;
  timezone?: string | null;
}

function ContactGlobeContent({ location, timezone }: ContactGlobeProps) {
  const t = useTranslations("main.contact.globe");
  const locale = useLocale();
  const [timeStr, setTimeStr] = useState<string>("");
  const [gmtOffset, setGmtOffset] = useState<string>("");

  useEffect(() => {
    if (!timezone) return;
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: timezone,
        }).format(now);
        setTimeStr(formatted);
        setGmtOffset(formatGmtOffset(timezone, now));
      } catch {
        // Fallback gracefully
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [locale, timezone]);

  const destination = { ...location, label: cityLabel(location.label) };
  const placeWithOffset = gmtOffset
    ? `${location.label} (${gmtOffset})`
    : location.label;

  return (
    <div className="flex h-full w-full flex-col gap-3.5">
      <div className="home-card-surface bg-card relative min-h-64 flex-1 overflow-hidden rounded-[2rem]">
        {/* Floating location tag */}
        <div className="glass-card text-foreground pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold">
          <Pin
            className="size-3.5 shrink-0 fill-rose-500 text-rose-500"
            aria-hidden="true"
          />
          <span>{location.label}</span>
        </div>

        {/* Floating live local time badge */}
        {timezone && timeStr ? (
          <div className="glass-card text-foreground pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-sm font-medium">
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-400 motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span>
              {t("localTime")}{" "}
              <b className="font-bold tabular-nums">{timeStr}</b>
              {gmtOffset ? (
                <span className="text-foreground/75"> ({gmtOffset})</span>
              ) : null}
            </span>
          </div>
        ) : null}

        {/* Interactive D3 Globe Map Canvas & Controls */}
        <GlobeMapLazy
          origin={destination}
          destination={destination}
          autoPlayConnection={false}
        />
      </div>

      {/* Distance caption */}
      <p className="text-foreground/80 px-1 text-center text-sm leading-relaxed">
        {t("basedIn", { place: placeWithOffset })}
      </p>
    </div>
  );
}

export function ContactGlobe({ location, timezone }: ContactGlobeProps) {
  return (
    <ContactGlobeContent
      key={`${location.lat}:${location.lon}:${timezone ?? ""}`}
      location={location}
      timezone={timezone}
    />
  );
}
