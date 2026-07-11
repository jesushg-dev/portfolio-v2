import {
  languageMapFromLocalized,
  localizedFromLanguageMap,
} from "@/lib/i18n/localized-json";
import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  translationMapEntries,
} from "@/lib/i18n/translation-map";

type TitleDescriptionFields = {
  title: string;
  description: string;
};

export function translationMapToLocalizedFields(
  translations: TranslationMap<TitleDescriptionFields>,
  languages: LanguageRef[],
  primaryCode: string,
) {
  const rows = translationMapEntries(translations);

  const titleByCode = Object.fromEntries(
    rows.map((entry) => {
      const language = languages.find(
        (lang) => lang.id === entry.appLanguageId,
      );
      return [language?.code ?? primaryCode, entry.title];
    }),
  );

  const descriptionByCode = Object.fromEntries(
    rows.map((entry) => {
      const language = languages.find(
        (lang) => lang.id === entry.appLanguageId,
      );
      return [language?.code ?? primaryCode, entry.description];
    }),
  );

  return {
    title: localizedFromLanguageMap(titleByCode, primaryCode),
    description: localizedFromLanguageMap(descriptionByCode, primaryCode),
  };
}

export function localizedFieldsToTranslationMap(
  title: Parameters<typeof languageMapFromLocalized>[0],
  description: Parameters<typeof languageMapFromLocalized>[0],
  languages: LanguageRef[],
): TranslationMap<TitleDescriptionFields> {
  const languageCodes = languages.map((language) => language.code);
  const titleMap = languageMapFromLocalized(title, languageCodes);
  const descriptionMap = languageMapFromLocalized(description, languageCodes);

  return Object.fromEntries(
    languages.map((language) => [
      language.id,
      {
        title: titleMap[language.code] ?? "",
        description: descriptionMap[language.code] ?? "",
      },
    ]),
  );
}
