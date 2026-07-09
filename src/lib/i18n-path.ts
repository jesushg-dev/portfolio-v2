import { pathnames, type Locale } from "@/i18n/config";

const LOCALE_PREFIX_RE = /^\/(en|es|nl)(?=\/|$)/;

/** Strip locale prefix from a request pathname. */
export function stripLocalePrefix(path: string): string {
  const stripped = path.replace(LOCALE_PREFIX_RE, "");
  return stripped === "" ? "/" : stripped;
}

/** Map a localized URL segment path back to the internal next-intl pathname key. */
export function localizedToInternalPath(
  requestPath: string,
  locale: Locale,
): string {
  const localized = stripLocalePrefix(requestPath);

  for (const [key, value] of Object.entries(pathnames)) {
    const internal = key.startsWith("/") ? key : `/${key}`;

    if (typeof value === "string") {
      if (localized === value || localized === internal) {
        return internal;
      }
      continue;
    }

    const match =
      value[locale] === localized ||
      value.en === localized ||
      localized === internal;

    if (match) {
      return internal;
    }
  }

  return localized;
}
