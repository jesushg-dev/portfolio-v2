import type { ComponentProps } from "react";

import type { Locale } from "@/i18n/config";
import { getPathname, type Link } from "@/i18n/routing";

export type AppHref = ComponentProps<typeof Link>["href"];
export type InternalPathHref = Extract<AppHref, string>;

export function safeInternalPath(value: string | null): InternalPathHref {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }
  return value as InternalPathHref;
}

/** Build an absolute callback URL for Better Auth using the active locale. */
export function buildLocalizedCallbackUrl(
  locale: Locale,
  href: InternalPathHref,
  origin?: string,
): string {
  const pathname = getPathname({ locale, href });
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${pathname}`;
}
