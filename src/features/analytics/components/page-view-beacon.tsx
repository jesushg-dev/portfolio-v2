"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISIT_KEY = "portfolio-analytics-visit";
const COLLECT_URL = "/api/analytics/collect";

function clientOptedOut(): boolean {
  if (typeof navigator === "undefined") return true;
  const dnt = navigator.doNotTrack;
  if (dnt === "1" || dnt === "yes") return true;
  return (
    "globalPrivacyControl" in navigator &&
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  );
}

function sendCollect(payload: {
  path: string;
  referrer: string;
  isNewVisit: boolean;
}) {
  const body = JSON.stringify(payload);
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(COLLECT_URL, blob)) return;
  } catch {
    // Fall through to fetch keepalive.
  }

  void fetch(COLLECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || clientOptedOut()) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      let isNewVisit = false;
      try {
        if (!sessionStorage.getItem(VISIT_KEY)) {
          sessionStorage.setItem(VISIT_KEY, "1");
          isNewVisit = true;
        }
      } catch {
        isNewVisit = false;
      }

      sendCollect({
        path: pathname,
        referrer: document.referrer,
        isNewVisit,
      });
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
