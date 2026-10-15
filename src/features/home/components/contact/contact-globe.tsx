"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { distanceKm, formatDistanceKm } from "@/lib/geo/distance";
import { useVisitorLocation } from "@/hooks/use-visitor-location";
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

export function ContactGlobe({ location }: { location: OwnerMapLocation }) {
  const t = useTranslations("main.contact.globe");
  const locale = useLocale();
  const { location: visitor, status } = useVisitorLocation();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat(
          locale === "es" ? "es-NI" : "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Managua",
          },
        ).format(now);
        setTimeStr(formatted);
      } catch {
        // Fallback gracefully
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [locale]);

  const hasVisitor = status === "success" && visitor != null;
  const origin = hasVisitor
    ? {
        lat: visitor.lat,
        lon: visitor.lon,
        label: visitor.city,
      }
    : { ...location, label: cityLabel(location.label) };
  const destination = { ...location, label: cityLabel(location.label) };

  const km = hasVisitor ? distanceKm(visitor, location) : null;

  return (
    <div className="flex h-full w-full flex-col gap-3.5">
      <div className="border-border/80 bg-muted/20 relative min-h-64 flex-1 overflow-hidden rounded-2xl border shadow-xs">
        {/* Floating location tag */}
        <div className="border-border/60 bg-card/90 text-card-foreground pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold shadow-xs backdrop-blur-md">
          <MapPin className="text-primary size-3.5" />
          <span>{location.label}</span>
        </div>

        {/* Floating live local time badge */}
        {timeStr ? (
          <div className="border-border/60 bg-card/90 text-card-foreground pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-xs backdrop-blur-md">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <span>
              {t("localTime")}{" "}
              <b className="font-mono tabular-nums">{timeStr}</b>
            </span>
          </div>
        ) : null}

        {/* Interactive D3 Globe Map Canvas & Controls */}
        <GlobeMapLazy
          origin={origin}
          destination={destination}
          autoPlayConnection
        />
      </div>

      {/* Distance caption */}
      <p className="text-muted-foreground px-1 text-center text-sm leading-relaxed">
        {km == null
          ? t("basedIn", { place: location.label })
          : km < 1
            ? t("nearbyFromVisitor", { place: location.label })
            : t.rich("distanceFromVisitor", {
                place: location.label,
                distance: formatDistanceKm(km, locale),
                km: (chunks) => (
                  <span className="text-primary font-semibold">{chunks}</span>
                ),
              })}
      </p>
    </div>
  );
}
