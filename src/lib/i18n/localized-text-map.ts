import type { LanguageRef } from "@/lib/i18n/editor-rows";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import {
  languageMapFromLocalized,
  localizedFromLanguageMap,
} from "@/lib/i18n/localized-json";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n/localized";
import type { Locale } from "@/i18n/config";
import {
  mergeTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import { z } from "zod";

export interface TextTranslationFields {
  text: string;
}

export type TextTranslationMap = TranslationMap<TextTranslationFields>;

export const TextTranslationMapSchema = z.record(
  z.string(),
  z.object({
    text: z.string(),
  }),
);

export function localizedJsonToTextMap(
  value: unknown,
  languages: LanguageRef[],
): TextTranslationMap {
  const primaryLanguage = resolvePrimaryLanguage(languages);
  const rows = languages.map((language) => ({
    appLanguageId: language.id,
    text: getLocalizedText(
      value,
      language.code as Locale,
      primaryLanguage?.code as Locale | undefined,
    ),
  }));

  return mergeTranslationMap(languages, rows, { text: "" });
}

export function textMapToLocalizedJson(
  map: TextTranslationMap,
  languages: LanguageRef[],
): LocalizedText | undefined {
  const primaryLanguage = resolvePrimaryLanguage(languages);
  if (!primaryLanguage) return undefined;

  const valuesByCode = Object.fromEntries(
    languages.map((language) => [language.code, map[language.id]?.text ?? ""]),
  );

  const localized = localizedFromLanguageMap(
    valuesByCode,
    primaryLanguage.code,
  );

  if (!localized.default.trim()) {
    return undefined;
  }

  return localized;
}

export function optionalTextMapToLocalizedJson(
  map: TextTranslationMap | undefined,
  languages: LanguageRef[],
) {
  if (!map) return undefined;
  return textMapToLocalizedJson(map, languages);
}

export function languageMapToTextMap(
  value: unknown,
  languages: LanguageRef[],
): TextTranslationMap {
  const languageCodes = languages.map((language) => language.code);
  const textByCode = languageMapFromLocalized(value, languageCodes);

  return Object.fromEntries(
    languages.map((language) => [
      language.id,
      { text: textByCode[language.code] ?? "" },
    ]),
  );
}
