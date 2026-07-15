import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptySkillCreateDto,
  mapSkillToEditorDto,
  mapSkillsToEditorDto,
} from "@/features/skills/lib/skill-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma, StackType } from "@prisma/client";

export async function getSkillCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptySkillCreateDto(languages),
    languages,
  };
}

export async function getSkillEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const skill = await db.skill.findUnique({
    where: { id, userId },
    include: {
      SkillTranslation: true,
      _count: { select: { ProjectSkill: true, CertificateSkill: true } },
    },
  });

  if (!skill) notFound();

  return {
    editorDto: mapSkillToEditorDto(skill, languages),
    languages,
  };
}

export async function getUserSkillsWithLanguages(params: DataTableParams) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  let orderBy: Prisma.SkillOrderByWithRelationInput = { title: "asc" };
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "title")
      orderBy = { title: sortField.desc ? "desc" : "asc" };
    if (sortField.id === "type")
      orderBy = { type: sortField.desc ? "desc" : "asc" };
  }

  const where: Prisma.SkillWhereInput = { userId };
  if (params.filters && params.filters.length > 0) {
    const titleFilter = params.filters.find((f) => f.id === "title");
    if (titleFilter && typeof titleFilter.value === "string") {
      where.title = { contains: titleFilter.value, mode: "insensitive" };
    }
    const typeFilter = params.filters.find((f) => f.id === "type");
    if (typeFilter && typeof typeFilter.value === "string") {
      where.type = typeFilter.value as StackType;
    }
  }

  const [skills, totalCount] = await Promise.all([
    db.skill.findMany({
      where,
      include: {
        SkillTranslation: { include: { language: true } },
        _count: { select: { ProjectSkill: true, CertificateSkill: true } },
      },
      orderBy,
      skip,
      take,
    }),
    db.skill.count({ where }),
  ]);

  return {
    data: mapSkillsToEditorDto(skills, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
