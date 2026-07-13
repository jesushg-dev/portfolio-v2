import type { Skill, SkillTranslation } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";

export interface SkillTranslationFields {
  description: string;
  urlWiki: string;
}

export type SkillTranslationMap = TranslationMap<SkillTranslationFields>;

export interface SkillEditorDTO {
  id: string;
  title: string;
  image: string;
  type: Skill["type"];
  translations: SkillTranslationMap;
  projectCount: number;
  certificateCount: number;
}

export type SkillCreateFormDTO = Omit<
  SkillEditorDTO,
  "id" | "projectCount" | "certificateCount"
>;

const emptySkillTranslationFields = { description: "", urlWiki: "" };

type SkillWithRelations = Skill & {
  SkillTranslation: SkillTranslation[];
  _count?: { ProjectSkill: number; CertificateSkill: number };
};

export function mapSkillToEditorDto(
  skill: SkillWithRelations,
  languages: LanguageRef[],
): SkillEditorDTO {
  const rows =
    skill.SkillTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      description: translation.description ?? "",
      urlWiki: translation.urlWiki ?? "",
    })) ?? [];

  return {
    id: skill.id,
    title: skill.title ?? "",
    image: skill.image ?? "",
    type: skill.type,
    translations: mergeTranslationMap(
      languages,
      rows,
      emptySkillTranslationFields,
    ),
    projectCount: skill._count?.ProjectSkill ?? 0,
    certificateCount: skill._count?.CertificateSkill ?? 0,
  };
}

export function mapSkillsToEditorDto(
  skills: SkillWithRelations[],
  languages: LanguageRef[],
): SkillEditorDTO[] {
  return skills.map((skill) => mapSkillToEditorDto(skill, languages));
}

export function buildEmptySkillCreateDto(
  languages: LanguageRef[],
): SkillCreateFormDTO {
  return {
    title: "",
    image: "",
    type: "FRONTEND",
    translations: buildEmptyTranslationMap(
      languages,
      emptySkillTranslationFields,
    ),
  };
}

export function mapSkillToPickerRow(
  skill: Pick<SkillEditorDTO, "id" | "title" | "image" | "type">,
) {
  return {
    id: skill.id,
    title: skill.title,
    image: skill.image,
    type: skill.type,
  };
}
