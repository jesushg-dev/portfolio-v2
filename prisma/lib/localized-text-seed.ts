export type LocaleCode = "es" | "en" | "nl";

export type LocaleMap = Partial<Record<LocaleCode, string>>;

export interface LocalizedTextSeed {
  default: string;
  translations?: Partial<Record<LocaleCode, string>>;
}

export const DEFAULT_LOCALE: LocaleCode = "es";

export function toLocalizedText(
  map: LocaleMap,
  defaultLocale: LocaleCode = DEFAULT_LOCALE,
): LocalizedTextSeed {
  const def =
    map[defaultLocale]?.trim() ?? map.es?.trim() ?? map.en?.trim() ?? "";

  const translations: Partial<Record<LocaleCode, string>> = {};
  for (const locale of ["es", "en", "nl"] as const) {
    if (locale === defaultLocale) continue;
    const value = map[locale]?.trim();
    if (value) translations[locale] = value;
  }

  return {
    default: def,
    translations:
      Object.keys(translations).length > 0 ? translations : undefined,
  };
}
