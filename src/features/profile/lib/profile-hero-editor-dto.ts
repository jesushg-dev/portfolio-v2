import type { TextTranslationMap } from "@/lib/i18n/localized-text-map";

export type ProfileHeroTitleEditorDTO = {
  order: number;
  translations: TextTranslationMap;
};

export type ProfileHeroEditorDTO = {
  fullName: string;
  photoUrl: string;
  backgroundImageUrl: string;
  heroSummaryTranslations: TextTranslationMap;
  aboutMeTranslations: TextTranslationMap;
  titles: ProfileHeroTitleEditorDTO[];
};
