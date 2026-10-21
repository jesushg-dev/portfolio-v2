"use client";

import { api } from "@/trpc/react";

/**
 * Fetches the visitor's approximate location via the tRPC `geo.getVisitorLocation`
 * procedure, which proxies ipapi.co server-side (no CORS, real client IP via
 * x-forwarded-for). In local development this is mocked as Amsterdam so the
 * contact globe can be previewed; production uses Vercel geo headers or ip-api.
 */
export function useVisitorLocation() {
  const { data, status } = api.geo.getVisitorLocation.useQuery(undefined, {
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 min — location doesn't change mid-session
  });

  return { location: data ?? null, status };
}
