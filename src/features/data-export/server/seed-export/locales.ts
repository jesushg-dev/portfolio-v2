import type { LanguageRef } from "@/lib/i18n/editor-rows";

export const SEED_LOCALES = ["es", "en", "nl"] as const;
export const MAP_LOCALES = ["en", "es", "nl"] as const;
export const TIMELINE_MAP_LOCALES = ["es", "en", "nl"] as const;

export type SeedLocale = (typeof SEED_LOCALES)[number];

export type LocaleMap = Partial<Record<SeedLocale, string>>;

const SEED_LOCALE_SET = new Set<string>(SEED_LOCALES);

export function isSeedLocale(code: string): code is SeedLocale {
  return SEED_LOCALE_SET.has(code);
}

export function languageCodeById(
  languages: LanguageRef[],
): Map<string, string> {
  return new Map(languages.map((language) => [language.id, language.code]));
}

function translationByLocale<T extends { appLanguageId: string }>(
  rows: T[],
  languages: LanguageRef[],
): Map<SeedLocale, T> {
  const codes = languageCodeById(languages);
  const byLocale = new Map<SeedLocale, T>();
  for (const row of rows) {
    const code = codes.get(row.appLanguageId);
    if (code && isSeedLocale(code)) {
      byLocale.set(code, row);
    }
  }
  return byLocale;
}

export function translationArray<T extends { appLanguageId: string }, R>(
  rows: T[],
  languages: LanguageRef[],
  mapRow: (row: T, locale: SeedLocale) => R,
): R[] {
  const byLocale = translationByLocale(rows, languages);
  const result: R[] = [];
  for (const locale of SEED_LOCALES) {
    const row = byLocale.get(locale);
    if (row) result.push(mapRow(row, locale));
  }
  return result;
}

export function localeMapFromRows<T extends { appLanguageId: string }>(
  rows: T[],
  languages: LanguageRef[],
  pick: (row: T) => string | null | undefined,
  localeOrder: readonly SeedLocale[] = MAP_LOCALES,
  options: { includeEmpty?: boolean } = {},
): LocaleMap {
  const byLocale = translationByLocale(rows, languages);
  const map: LocaleMap = {};
  for (const locale of localeOrder) {
    const row = byLocale.get(locale);
    if (!row) {
      if (options.includeEmpty) map[locale] = "";
      continue;
    }
    const value = pick(row) ?? "";
    if (value || options.includeEmpty) {
      map[locale] = value;
    }
  }
  return map;
}

export function englishText<T extends { appLanguageId: string }>(
  rows: T[],
  languages: LanguageRef[],
  pick: (row: T) => string | null | undefined,
): string {
  const byLocale = translationByLocale(rows, languages);
  for (const locale of ["en", "es", "nl"] as const) {
    const row = byLocale.get(locale);
    if (!row) continue;
    const value = pick(row);
    if (value) return value;
  }
  return "";
}
