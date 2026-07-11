import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyProjectCreateDto,
  mapProjectToEditorDto,
  mapProjectsToEditorDto,
} from "@/features/projects/lib/project-editor-dto";

export async function getProjectCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyProjectCreateDto(languages),
    languages,
  };
}

export async function getProjectEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

  const project = await db.project.findUnique({
    where: { id, userId },
    include: {
      ProjectTranslation: true,
      ProjectSkill: true,
    },
  });

  if (!project) notFound();

  return {
    editorDto: mapProjectToEditorDto(project, languages),
    languages,
  };
}

export async function getUserProjectsWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const projects = await db.project.findMany({
    where: { userId: userId! },
    include: {
      ProjectTranslation: { include: { language: true } },
      ProjectSkill: { include: { Skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: mapProjectsToEditorDto(projects, languages),
    languages,
  };
}
