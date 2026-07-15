import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyProjectCreateDto,
  mapProjectToEditorDto,
  mapProjectsToEditorDto,
} from "@/features/projects/lib/project-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma, StackType } from "@prisma/client";

export async function getProjectCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyProjectCreateDto(languages),
    languages,
  };
}

export async function getProjectEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

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

export async function getUserProjectsWithLanguages(params: DataTableParams) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "type") {
      orderBy = { type: sortField.desc ? "desc" : "asc" };
    }
  }

  const where: Prisma.ProjectWhereInput = { userId };
  if (params.filters && params.filters.length > 0) {
    const typeFilter = params.filters.find((f) => f.id === "type");
    if (typeFilter && typeof typeFilter.value === "string") {
      where.type = typeFilter.value as StackType;
    }
  }

  const [projects, totalCount] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        ProjectTranslation: { include: { language: true } },
        ProjectSkill: { include: { Skill: true } },
      },
      orderBy,
      skip,
      take,
    }),
    db.project.count({ where }),
  ]);

  return {
    data: mapProjectsToEditorDto(projects, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
