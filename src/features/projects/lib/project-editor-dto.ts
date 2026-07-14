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
  hook: string;
  challenge: string;
  approach: string;
  outcome: string;
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
  order: number;
  kind: Project["kind"];
  slug: string;
  caseStudyEnabled: boolean;
  translations: ProjectTranslationMap;
}

export type ProjectCreateFormDTO = Omit<ProjectEditorDTO, "id">;

const emptyProjectTranslationFields = {
  title: "",
  description: "",
  hook: "",
  challenge: "",
  approach: "",
  outcome: "",
};

type ProjectWithRelations = Project & {
  ProjectTranslation: ProjectTranslation[];
  ProjectSkill: ProjectSkill[];
};

export function mapProjectToEditorDto(
  project: ProjectWithRelations,
  languages: LanguageRef[],
): ProjectEditorDTO {
  const rows =
    project.ProjectTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      title: translation.title,
      description: translation.description,
      hook: translation.hook ?? "",
      challenge: translation.challenge ?? "",
      approach: translation.approach ?? "",
      outcome: translation.outcome ?? "",
    })) ?? [];

  return {
    id: project.id,
    image: project.image ?? "",
    type: project.type,
    githubUrl: project.githubUrl ?? "",
    websiteUrl: project.websiteUrl ?? "",
    isPrivate: project.isPrivate,
    skillIds: project.ProjectSkill?.map((entry) => entry.skillId) ?? [],
    order: project.order ?? 0,
    kind: project.kind ?? "PERSONAL",
    slug: project.slug ?? "",
    caseStudyEnabled: project.caseStudyEnabled ?? false,
    translations: mergeTranslationMap(
      languages,
      rows,
      emptyProjectTranslationFields,
    ),
  };
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
    order: 0,
    kind: "PERSONAL",
    slug: "",
    caseStudyEnabled: false,
    translations: buildEmptyTranslationMap(
      languages,
      emptyProjectTranslationFields,
    ),
  };
}
