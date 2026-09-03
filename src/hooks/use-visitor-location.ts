"use client";

import { api } from "@/trpc/react";

/**
 * Fetches the visitor's approximate location via the tRPC `geo.getVisitorLocation`
 * procedure, which proxies ipapi.co server-side (no CORS, real client IP via
 * x-forwarded-for). Returns null on localhost or when lookup fails — the globe
 * then uses the portfolio owner's configured map location.
 */
export function useVisitorLocation() {
  const { data, status } = api.geo.getVisitorLocation.useQuery(undefined, {
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 min — location doesn't change mid-session
  });

  return { location: data ?? null, status };
}
