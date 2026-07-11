import { type Locale, locales } from "@/i18n/config";
import { getLocalizedText } from "@/lib/i18n/localized";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localizedFromLanguageMap(
  valuesByCode: Record<string, string>,
  primaryCode: string,
): { default: string; translations?: Record<string, string> } {
  const defaultText = valuesByCode[primaryCode]?.trim() ?? "";
  const translations = Object.fromEntries(
    Object.entries(valuesByCode).filter(
      ([code, value]) => code !== primaryCode && value.trim() !== "",
    ),
  );

  return {
    default: defaultText,
    ...(Object.keys(translations).length > 0 ? { translations } : {}),
  };
}

export function languageMapFromLocalized(
  value: unknown,
  languageCodes: string[],
): Record<string, string> {
  return Object.fromEntries(
    languageCodes.map((code) => [
      code,
      getLocalizedText(value, isLocale(code) ? code : "en"),
    ]),
  );
}
