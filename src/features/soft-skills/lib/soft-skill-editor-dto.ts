import type {
  AppLanguage,
  PortfolioSoftSkill,
  PortfolioSoftSkillTranslation,
} from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";

export interface SoftSkillTranslationFields {
  title: string;
  description: string;
  badge: string;
}

export type SoftSkillTranslationMap =
  TranslationMap<SoftSkillTranslationFields>;

export interface SoftSkillEditorDTO {
  id: string;
  icon: string;
  isVisible: boolean;
  featured: boolean;
  order: number;
  translations: SoftSkillTranslationMap;
}

export type SoftSkillCreateFormDTO = Omit<SoftSkillEditorDTO, "id">;

const emptySoftSkillTranslationFields: SoftSkillTranslationFields = {
  title: "",
  description: "",
  badge: "",
};

type SoftSkillLanguageRef = Pick<AppLanguage, "id" | "code">;

export type SoftSkillWithTranslations = PortfolioSoftSkill & {
  PortfolioSoftSkillTranslation?: PortfolioSoftSkillTranslation[];
};

export function mapSoftSkillToEditorDto(
  item: SoftSkillWithTranslations,
  languages: SoftSkillLanguageRef[],
): SoftSkillEditorDTO {
  const translationsMap = item.PortfolioSoftSkillTranslation ?? [];

  return {
    id: item.id,
    icon: item.icon,
    isVisible: item.isVisible,
    featured: item.featured,
    order: item.order,
    translations: Object.fromEntries(
      languages.map((language) => {
        const found = translationsMap.find(
          (t) => t.appLanguageId === language.id,
        );
        return [
          language.id,
          {
            title: found?.title ?? "",
            description: found?.description ?? "",
            badge: found?.badge ?? "",
          },
        ];
      }),
    ),
  };
}

export function mapSoftSkillsToEditorDto(
  items: SoftSkillWithTranslations[],
  languages: SoftSkillLanguageRef[],
): SoftSkillEditorDTO[] {
  return items.map((item) => mapSoftSkillToEditorDto(item, languages));
}

export function buildEmptySoftSkillCreateDto(
  languages: LanguageRef[],
): SoftSkillCreateFormDTO {
  return {
    icon: "",
    isVisible: true,
    featured: false,
    order: 0,
    translations: buildEmptyTranslationMap(
      languages,
      emptySoftSkillTranslationFields,
    ),
  };
}

export function getSoftSkillTranslationText(
  item: Pick<SoftSkillEditorDTO, "translations">,
  languages: LanguageRef[],
  localeCode: string,
  field: "title" | "description" | "badge",
): string {
  const resolver = createLocalizedFieldResolver(languages, localeCode);
  return resolver(item.translations, field);
}
