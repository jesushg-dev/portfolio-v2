import type { TextTranslationMap } from "@/lib/i18n/translation-map";

export interface ProfileHeroTitleEditorDTO {
  order: number;
  translations: TextTranslationMap;
}

export interface ProfileHeroEditorDTO {
  fullName: string;
  photoUrl: string;
  backgroundImageUrl: string;
  heroSummaryTranslations: TextTranslationMap;
  aboutMeTranslations: TextTranslationMap;
  titles: ProfileHeroTitleEditorDTO[];
}
