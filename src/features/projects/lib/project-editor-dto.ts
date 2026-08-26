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
  techDecisions: string;
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
  gallery: string[];
  metrics: { label: string; value: string; icon?: string }[] | null;
  timeline: { title: string; description?: string; date?: string }[] | null;
  beforeAfter: { before: string; after: string; beforeLabel?: string; afterLabel?: string } | null;
  demoUrl: string;
  testimonial: string;
  testimonialAuthor: string;
  testimonialRole: string;
  testimonialAvatar: string;
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
  techDecisions: "",
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
      techDecisions: translation.techDecisions ?? "",
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
    gallery: project.gallery ?? [],
    metrics: (project.metrics as ProjectEditorDTO["metrics"]) ?? null,
    timeline: (project.timeline as ProjectEditorDTO["timeline"]) ?? null,
    beforeAfter: (project.beforeAfter as ProjectEditorDTO["beforeAfter"]) ?? null,
    demoUrl: project.demoUrl ?? "",
    testimonial: project.testimonial ?? "",
    testimonialAuthor: project.testimonialAuthor ?? "",
    testimonialRole: project.testimonialRole ?? "",
    testimonialAvatar: project.testimonialAvatar ?? "",
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
    gallery: [],
    metrics: null,
    timeline: null,
    beforeAfter: null,
    demoUrl: "",
    testimonial: "",
    testimonialAuthor: "",
    testimonialRole: "",
    testimonialAvatar: "",
    translations: buildEmptyTranslationMap(
      languages,
      emptyProjectTranslationFields,
    ),
  };
}
