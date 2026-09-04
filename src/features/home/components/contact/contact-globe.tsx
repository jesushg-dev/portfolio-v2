"use client";

import { useLocale, useTranslations } from "next-intl";

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
    <div className="flex h-full w-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <GlobeMapLazy
          origin={origin}
          destination={destination}
          autoPlayConnection
        />
      </div>
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
