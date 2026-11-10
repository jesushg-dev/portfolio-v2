"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { distanceKm, formatDistanceKm } from "@/lib/geo/distance";
import { useVisitorLocation } from "@/hooks/use-visitor-location";
import GlobeMapLazy from "./globe-map-lazy";
import { TRPCReactProvider } from "@/trpc/react";

export interface OwnerMapLocation {
  lat: number;
  lon: number;
  label: string;
}

function cityLabel(place: string): string {
  const city = place.split(",")[0]?.trim();
  return city && city.length > 0 ? city : place;
}

interface ContactGlobeProps {
  location: OwnerMapLocation;
  timezone?: string | null;
}

function ContactGlobeContent({ location, timezone }: ContactGlobeProps) {
  const t = useTranslations("main.contact.globe");
  const locale = useLocale();
  const { location: visitor, status } = useVisitorLocation();
  const [timeStr, setTimeStr] = useState<string>("");

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
      } catch {
        // Fallback gracefully
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [locale, timezone]);

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
      <div className="border-border/40 bg-card/20 relative min-h-64 flex-1 overflow-hidden rounded-[2rem] border backdrop-blur-lg">
        {/* Floating location tag */}
        <div className="border-border/50 bg-background/55 text-foreground pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl">
          <MapPin className="text-primary size-3.5" />
          <span>{location.label}</span>
        </div>

        {/* Floating live local time badge */}
        {timezone && timeStr ? (
          <div className="border-border/50 bg-background/55 text-foreground pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl">
            <span className="bg-primary/70 size-1.5 rounded-full" />
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

export function ContactGlobe({ location, timezone }: ContactGlobeProps) {
  return (
    <TRPCReactProvider>
      <ContactGlobeContent
        key={`${location.lat}:${location.lon}:${timezone ?? ""}`}
        location={location}
        timezone={timezone}
      />
    </TRPCReactProvider>
  );
}
