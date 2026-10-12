import type { TextTranslationMap } from "@/lib/i18n/translation-map";

export interface ProfileHeroEditorDTO {
  fullName: string;
  photoUrl: string;
  heroSubtitleTranslations: TextTranslationMap;
  heroTaglineTranslations: TextTranslationMap;
  heroSummaryTranslations: TextTranslationMap;
  clientImageAltTranslations: TextTranslationMap;
  heroBadgeTranslations: TextTranslationMap;
}

export interface ProfileAboutEditorDTO {
  aboutMeTranslations: TextTranslationMap;
}
