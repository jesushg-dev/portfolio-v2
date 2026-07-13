import type { AppLanguage, PortfolioSoftSkill } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import { getLocalizedFieldForLocale } from "@/lib/i18n/localized-display";
import { localizedFieldsToTranslationMap } from "@/lib/i18n/localized-persist";

export interface SoftSkillTranslationFields {
  title: string;
  description: string;
}

export type SoftSkillTranslationMap =
  TranslationMap<SoftSkillTranslationFields>;

export interface SoftSkillEditorDTO {
  id: string;
  icon: string;
  isVisible: boolean;
  order: number;
  translations: SoftSkillTranslationMap;
}

export type SoftSkillCreateFormDTO = Omit<SoftSkillEditorDTO, "id">;

const emptySoftSkillTranslationFields = { title: "", description: "" };

type SoftSkillLanguageRef = Pick<AppLanguage, "id" | "code">;

export function mapSoftSkillToEditorDto(
  item: PortfolioSoftSkill,
  languages: SoftSkillLanguageRef[],
): SoftSkillEditorDTO {
  return {
    id: item.id,
    icon: item.icon,
    isVisible: item.isVisible,
    order: item.order,
    translations: localizedFieldsToTranslationMap(
      item.title,
      item.description,
      languages,
    ),
  };
}

export function mapSoftSkillsToEditorDto(
  items: PortfolioSoftSkill[],
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
  field: "title" | "description",
): string {
  return getLocalizedFieldForLocale(
    item.translations,
    languages,
    localeCode,
    field,
  );
}
