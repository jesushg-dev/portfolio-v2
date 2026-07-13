import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  translationMapEntries,
} from "@/lib/i18n/translation-map";

export type { LanguageRef };

type TranslationEntry<T extends Record<keyof T, string>> =
  ({ appLanguageId: string } & T)[] | TranslationMap<T>;

function toTranslationRows<T extends Record<keyof T, string>>(
  translations: TranslationEntry<T>,
): ({ appLanguageId: string } & T)[] {
  return Array.isArray(translations)
    ? translations
    : translationMapEntries(translations);
}

export function getRowTextForLocale(
  rows:
    | { appLanguageId: string; text: string }[]
    | TranslationMap<{ text: string }>,
  languages: LanguageRef[],
  localeCode: string,
): string {
  const entries = toTranslationRows(
    Array.isArray(rows)
      ? rows
      : Object.fromEntries(
          Object.entries(rows).map(([appLanguageId, value]) => [
            appLanguageId,
            value,
          ]),
        ),
  );
  const language =
    languages.find((lang) => lang.code === localeCode) ?? languages[0];
  if (!language) return "";

  const entry = entries.find((row) => row.appLanguageId === language.id);
  const localized = entry?.text?.trim();
  if (localized) return localized;

  const primaryLanguage =
    languages.find((lang) => lang.code === "en") ?? languages[0];
  const primaryEntry = entries.find(
    (row) => row.appLanguageId === primaryLanguage?.id,
  );
  const primaryText = primaryEntry?.text?.trim();
  if (primaryText) return primaryText;

  const firstNonEmpty = entries.find((row) => row.text?.trim());
  return firstNonEmpty?.text?.trim() ?? "";
}

export function getLocalizedFieldForLocale<T extends Record<keyof T, string>>(
  translations: TranslationEntry<T>,
  languages: LanguageRef[],
  localeCode: string,
  field: keyof T & string,
): string {
  const entries = toTranslationRows(translations);
  const language =
    languages.find((lang) => lang.code === localeCode) ?? languages[0];
  if (!language) return "";

  const entry = entries.find(
    (translation) => translation.appLanguageId === language.id,
  );
  const localized = entry?.[field];
  if (typeof localized === "string" && localized.trim())
    return localized.trim();

  const primaryLanguage =
    languages.find((lang) => lang.code === "en") ?? languages[0];
  const primaryEntry = entries.find(
    (translation) => translation.appLanguageId === primaryLanguage?.id,
  );
  const primaryText = primaryEntry?.[field];
  if (typeof primaryText === "string" && primaryText.trim()) {
    return primaryText.trim();
  }

  const firstNonEmpty = entries.find((translation) => {
    const value = translation[field];
    return typeof value === "string" && value.trim();
  });
  const fallback = firstNonEmpty?.[field];
  return typeof fallback === "string" ? fallback.trim() : "";
}

export function getTitleDescriptionForLocale<T extends Record<keyof T, string>>(
  translations: TranslationEntry<T & { title: string; description: string }>,
  languages: LanguageRef[],
  localeCode: string,
  field: "title" | "description",
): string {
  return getLocalizedFieldForLocale(translations, languages, localeCode, field);
}
