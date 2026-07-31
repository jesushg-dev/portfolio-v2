import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

interface IpApiResponse {
  status: string;
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
}

export const geoRouter = createTRPCRouter({
  /**
   * Returns the visitor's approximate lat/lon.
   * Primary: Uses Vercel Geolocation headers (0ms latency, zero rate-limit).
   * Secondary (fallback for local dev / non-Vercel environments): Queries ip-api.com.
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
          country: vercelCountry ? decodeURIComponent(vercelCountry) : undefined,
        };
      }
    }

    // 2. Fallback to ip-api.com for local development or non-Vercel hosts
    const forwardedFor = ctx.headers.get("x-forwarded-for");
    const realIp = ctx.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? "";

    // On local environment without IP, return null (handled by fallback UI/default origin)
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
      return null;
    }

    try {
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`,
        {
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        },
      );

      if (!res.ok) return null;

      const data = (await res.json()) as IpApiResponse;

      if (data.status !== "success" || data.lat === undefined || data.lon === undefined) {
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
