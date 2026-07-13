import type { AppLanguage } from "@prisma/client";
import type { LocalizedText } from "@/lib/i18n/localized";

export interface TranslationEntry {
  appLanguageId: string;
  title: string;
  description?: string;
  urlWiki?: string;
}

export function fillMissingTranslations<T extends object>(
  data: T | null | undefined,
  languages: AppLanguage[],
): TranslationEntry[] {
  const rawData = data as Record<string, unknown> | null | undefined;
  let existingTranslations: TranslationEntry[] = [];

  // Case 1: Relationship array (e.g. ProjectTranslation[], CertificationTranslation[])
  // In Prisma, we look for properties ending in "Translation"
  const translationKey = Object.keys(rawData ?? {}).find((k) =>
    k.endsWith("Translation"),
  );
  if (translationKey && rawData && Array.isArray(rawData[translationKey])) {
    const rawTranslations = rawData[translationKey] as Record<
      string,
      unknown
    >[];
    existingTranslations = rawTranslations.map((t) => ({
      appLanguageId: String(t.appLanguageId),
      title: typeof t.title === "string" ? t.title : "",
      description: typeof t.description === "string" ? t.description : "",
      urlWiki: typeof t.urlWiki === "string" ? t.urlWiki : "",
    }));
  }
  // Case 2: LocalizedText (Json object like timeline title/description)
  else if (
    rawData?.title &&
    typeof rawData.title === "object" &&
    rawData.title !== null
  ) {
    const titleObj = rawData.title as unknown as LocalizedText;
    const descObj = (rawData.description as LocalizedText) ?? {};

    // Default language is usually "en" (or we extract from keys)
    const map = new Map<string, TranslationEntry>();

    // Try to extract from translations object
    if (titleObj.translations) {
      Object.entries(titleObj.translations).forEach(([langId, titleStr]) => {
        if (titleStr) {
          map.set(langId, {
            appLanguageId: langId,
            title: titleStr,
            description:
              descObj.translations?.[
                langId as keyof typeof descObj.translations
              ] ?? "",
          });
        }
      });
    }

    // Also, LocalizedText has a "default". It doesn't store WHICH language is default
    // We assume default is "en", unless "en" is already in translations
    if (titleObj.default && !map.has("en")) {
      map.set("en", {
        appLanguageId: "en",
        title: titleObj.default,
        description: descObj.default ?? "",
      });
    }

    existingTranslations = Array.from(map.values());
  }

  const existingLangIds = new Set(
    existingTranslations.map((t) => t.appLanguageId),
  );

  const missingLangs = languages.filter((l) => !existingLangIds.has(l.id));

  return [
    ...existingTranslations,
    ...missingLangs.map((l) => ({
      appLanguageId: l.id,
      title: "",
      description: "",
      urlWiki: "",
    })),
  ];
}
