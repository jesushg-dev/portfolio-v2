"use client";

// TODO: Re-enable visitor IP geolocation lookup once IP service is 100% stable.
// import { useVisitorLocation } from "@/hooks/use-visitor-location";
import GlobeMapLazy from "./globe-map-lazy";

/** Portfolio owner location — Managua, Nicaragua. */
const MY_LOCATION = {
  lat: 12.1364,
  lon: -86.2514,
  label: "Managua, Nicaragua",
};

/**
 * Renders the globe focused directly on Managua, Nicaragua.
 * Geolocation visitor lookup is temporarily commented out.
 */
export function ContactGlobe() {
  /*
  // TODO: Restore dynamic visitor location connection arc.
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
  */

  return (
    <GlobeMapLazy
      origin={MY_LOCATION}
      destination={MY_LOCATION}
      autoPlayConnection
    />
  );
}
