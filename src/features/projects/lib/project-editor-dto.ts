import type { Project, ProjectSkill, ProjectTranslation } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  mergeTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";

export interface ProjectTranslationFields {
  title: string;
  description: string;
}

export type ProjectTranslationMap = TranslationMap<ProjectTranslationFields>;

export interface ProjectEditorDTO {
  id: string;
  image: string;
  type: Project["type"];
  githubUrl: string;
  websiteUrl: string;
  isPrivate: boolean;
  skillIds: string[];
  translations: ProjectTranslationMap;
}

export type ProjectCreateFormDTO = Omit<ProjectEditorDTO, "id">;

const emptyProjectTranslationFields = { title: "", description: "" }

type ProjectWithRelations = Project & {
  ProjectTranslation: ProjectTranslation[];
  ProjectSkill: ProjectSkill[];
}

export function mapProjectToEditorDto(
  project: ProjectWithRelations,
  languages: LanguageRef[],
): ProjectEditorDTO {
  const rows =
    project.ProjectTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      title: translation.title,
      description: translation.description,
    })) ?? [];

  return {
    id: project.id,
    image: project.image ?? "",
    type: project.type,
    githubUrl: project.githubUrl ?? "",
    websiteUrl: project.websiteUrl ?? "",
    isPrivate: project.isPrivate,
    skillIds: project.ProjectSkill?.map((entry) => entry.skillId) ?? [],
    translations: mergeTranslationMap(
      languages,
      rows,
      emptyProjectTranslationFields,
    ),
  }
}

export function mapProjectsToEditorDto(
  projects: ProjectWithRelations[],
  languages: LanguageRef[],
): ProjectEditorDTO[] {
  return projects.map((project) => mapProjectToEditorDto(project, languages));
}

export function buildEmptyProjectCreateDto(
  languages: LanguageRef[],
): ProjectCreateFormDTO {
  return {
    image: "",
    type: "FRONTEND",
    githubUrl: "",
    websiteUrl: "",
    isPrivate: false,
    skillIds: [],
    translations: buildEmptyTranslationMap(
      languages,
      emptyProjectTranslationFields,
    ),
  }
}

