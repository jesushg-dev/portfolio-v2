export interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

const LAT_LON_RE = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*)$/;

export function parseLatLon(
  value: string,
): { lat: number; lon: number } | null {
  const match = LAT_LON_RE.exec(value.trim());
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export function locationQueryFromContacts(
  contacts: { type: string; value: string }[],
): string | null {
  const location = contacts.find(
    (contact) => contact.type === "LOCATION" && contact.value.trim().length > 0,
  );
  return location?.value.trim() ?? null;
}

interface NominatimHit {
  lat?: string;
  lon?: string;
  display_name?: string;
}

export async function resolveOwnerMapLocation(input: {
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapLocationLabel?: string | null;
  contactQuery?: string | null;
}): Promise<GeoPoint | null> {
  const lat = input.mapLatitude;
  const lon = input.mapLongitude;
  const mapLabel = input.mapLocationLabel?.trim();
  const contactLabel = input.contactQuery?.trim();
  const query =
    (mapLabel ? mapLabel : undefined) ??
    (contactLabel ? contactLabel : undefined);

  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lon === "number" &&
    Number.isFinite(lon)
  ) {
    return { lat, lon, label: query ?? "Location" };
  }

  if (!query) return null;
  return geocodePlace(query);
}

export async function geocodePlace(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const parsed = parseLatLon(trimmed);
  if (parsed) {
    return { ...parsed, label: trimmed };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", trimmed);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "portfolio-v2-tenant-map/1.0",
      },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;

    const hits = (await response.json()) as NominatimHit[];
    const hit = hits[0];
    const lat = Number(hit?.lat);
    const lon = Number(hit?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      label: trimmed,
    };
  } catch {
    return null;
  }
}
