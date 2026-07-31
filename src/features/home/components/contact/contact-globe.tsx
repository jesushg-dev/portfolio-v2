"use client";

import { useVisitorLocation } from "@/hooks/use-visitor-location";
import GlobeMapLazy from "./globe-map-lazy";

/** Your location — portfolio owner. */
const MY_LOCATION = {
  lat: 12.1364,
  lon: -86.2514,
  label: "Managua",
};

/**
 * Renders the globe that connects the visitor's detected location to
 * Managua (portfolio owner). Falls back to Managua as the origin when
 * geolocation is unavailable.
 */
export function ContactGlobe() {
  const { location, status } = useVisitorLocation();

  const origin =
    status === "success" && location
      ? {
          lat: location.lat,
          lon: location.lon,
          label: location.city ?? location.country ?? "Tu ubicación",
        }
      : MY_LOCATION;

  const destination = MY_LOCATION;

  const isSameCity =
    Math.abs(origin.lat - destination.lat) < 0.5 &&
    Math.abs(origin.lon - destination.lon) < 0.5;

  const finalOrigin = isSameCity
    ? { lat: 14.0818, lon: -87.2068, label: "Tegucigalpa" }
    : origin;

  return (
    <GlobeMapLazy
      origin={finalOrigin}
      destination={destination}
      autoPlayConnection
    />
  );
}
