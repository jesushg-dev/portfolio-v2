import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptySoftSkillCreateDto,
  mapSoftSkillToEditorDto,
  mapSoftSkillsToEditorDto,
} from "@/features/soft-skills/lib/soft-skill-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma } from "@prisma/client";

export async function getSoftSkillCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptySoftSkillCreateDto(languages),
    languages,
  };
}

export async function getSoftSkillEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const item = await db.portfolioSoftSkill.findUnique({
    where: { id, userId },
    include: {
      PortfolioSoftSkillTranslation: true,
    },
  });

  if (!item) notFound();

  return {
    editorDto: mapSoftSkillToEditorDto(item, languages),
    languages,
  };
}

export async function getUserSoftSkillsWithLanguages(params: DataTableParams) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  let orderBy:
    | Prisma.PortfolioSoftSkillOrderByWithRelationInput
    | Prisma.PortfolioSoftSkillOrderByWithRelationInput[] = [
    { order: "asc" },
    { createdAt: "asc" },
  ];
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "order")
      orderBy = { order: sortField.desc ? "desc" : "asc" };
  }

  const where: Prisma.PortfolioSoftSkillWhereInput = { userId };

  const [items, totalCount] = await Promise.all([
    db.portfolioSoftSkill.findMany({
      where,
      include: {
        PortfolioSoftSkillTranslation: true,
      },
      orderBy,
      skip,
      take,
    }),
    db.portfolioSoftSkill.count({ where }),
  ]);

  return {
    data: mapSoftSkillsToEditorDto(items, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
