"use client";

import { useVisitorLocation } from "@/hooks/use-visitor-location";
import GlobeMapLazy from "./globe-map-lazy";

export interface OwnerMapLocation {
  lat: number;
  lon: number;
  label: string;
}

export function ContactGlobe({ location }: { location: OwnerMapLocation }) {
  const { location: visitor, status } = useVisitorLocation();

  const origin =
    status === "success" && visitor
      ? {
          lat: visitor.lat,
          lon: visitor.lon,
          label: visitor.city ?? visitor.country ?? "You",
        }
      : location;

  return (
    <GlobeMapLazy origin={origin} destination={location} autoPlayConnection />
  );
}
