import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  isPrivateOrLocalIpv4,
  isValidIpv4,
} from "@/lib/http/client-ip";

interface IpApiResponse {
  status: string;
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
}

/** Preview visitor pin + distance locally (no public IP on localhost). */
const DEV_VISITOR_NETHERLANDS = {
  lat: 52.3676,
  lon: 4.9041,
  city: "Amsterdam",
  country: "Netherlands",
};

function isLocalIp(ip: string): boolean {
  if (ip === "::1") return true;
  if (!isValidIpv4(ip)) return true;
  return isPrivateOrLocalIpv4(ip);
}

export const geoRouter = createTRPCRouter({
  /**
   * Returns the visitor's approximate lat/lon.
   * Primary: Uses Vercel Geolocation headers (0ms latency, zero rate-limit).
   * Secondary (fallback for local dev / non-Vercel environments): Queries ip-api.com.
   * On localhost in development, mocks Amsterdam so the contact globe can be previewed.
   */
  getVisitorLocation: publicProcedure.query(async ({ ctx }) => {
    // 1. Check Vercel Geolocation Headers
    const vercelLat = ctx.headers.get("x-vercel-ip-latitude");
    const vercelLon = ctx.headers.get("x-vercel-ip-longitude");
    const vercelCity = ctx.headers.get("x-vercel-ip-city");
    const vercelCountry = ctx.headers.get("x-vercel-ip-country");

    if (vercelLat && vercelLon) {
      const lat = parseFloat(vercelLat);
      const lon = parseFloat(vercelLon);

      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          lat,
          lon,
          city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
          country: vercelCountry
            ? decodeURIComponent(vercelCountry)
            : undefined,
        };
      }
    }

    // 2. Fallback to ip-api.com for local development or non-Vercel hosts
    const forwardedFor = ctx.headers.get("x-forwarded-for");
    const realIp = ctx.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? "";

    if (!isValidIpv4(ip) || isLocalIp(ip)) {
      if (process.env.NODE_ENV !== "production") {
        return DEV_VISITOR_NETHERLANDS;
      }
      return null;
    }

    try {
      const res = await fetch(
        `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,lat,lon`,
        {
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        },
      );

      if (!res.ok) return null;

      const data = (await res.json()) as IpApiResponse;

      if (
        data.status !== "success" ||
        data.lat === undefined ||
        data.lon === undefined
      ) {
        return null;
      }

      return {
        lat: data.lat,
        lon: data.lon,
        city: data.city,
        country: data.country,
      };
    } catch {
      return null;
    }
  }),
});
