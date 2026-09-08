import { locales, pathnames, type Locale } from "@/i18n/config";
import { localizedToInternalPath, stripLocalePrefix } from "@/lib/i18n-path";

const LOCALE_PREFIX_RE = /^\/(en|es|nl)(?=\/|$)/;
const MAX_PATH_LENGTH = 180;

const SKIP_EXACT = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
]);

const SKIP_PREFIXES = ["/admin", "/api"];

export function inferLocaleFromPath(path: string): Locale | undefined {
  const match = LOCALE_PREFIX_RE.exec(path);
  if (!match) return undefined;
  return locales.find((locale) => locale === match[1]);
}

function collapseSlashes(path: string): string {
  return path.replace(/\/{2,}/g, "/");
}

function stripQueryAndHash(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? "/";
}

function matchDynamicInternalPath(stripped: string): string | null {
  for (const [key, value] of Object.entries(pathnames)) {
    if (!key.includes("[slug]")) continue;

    const variants = typeof value === "string" ? [value] : Object.values(value);

    for (const variant of variants) {
      const prefix = variant.replace("/[slug]", "");
      if (stripped === prefix) {
        return key.replace("/[slug]", "") || "/";
      }
      if (stripped.startsWith(`${prefix}/`)) {
        const rest = stripped.slice(prefix.length);
        return key.replace("/[slug]", rest);
      }
    }
  }

  return null;
}

/** Normalize a request pathname into a locale-stable analytics path. */
export function toAnalyticsPath(rawPath: string, locale?: Locale): string {
  const trimmed = stripQueryAndHash(rawPath).trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const collapsed = collapseSlashes(withSlash).replace(/\/+$/, "") || "/";
  const inferred = inferLocaleFromPath(collapsed) ?? locale ?? "en";
  const stripped = stripLocalePrefix(collapsed);

  const dynamic = matchDynamicInternalPath(stripped);
  if (dynamic) {
    return dynamic.slice(0, MAX_PATH_LENGTH);
  }

  const exact = localizedToInternalPath(collapsed, inferred);
  if (!exact.includes("[")) {
    return exact.slice(0, MAX_PATH_LENGTH);
  }

  return stripped.slice(0, MAX_PATH_LENGTH);
}

export function isSkippedAnalyticsPath(path: string): boolean {
  if (SKIP_EXACT.has(path)) return true;
  return SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
