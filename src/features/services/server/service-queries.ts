import { notFound } from "next/navigation";
import { buildServiceListWhere } from "../lib/service-list-filters";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyServiceCreateDto,
  mapServiceToEditorDto,
  mapServicesToEditorDto,
} from "@/features/services/lib/service-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma } from "@prisma/client";

export async function getServiceCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyServiceCreateDto(languages),
    languages,
  };
}

export async function getServiceEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const service = await db.service.findUnique({
    where: { id, userId },
    include: {
      ServiceTranslation: true,
      ServiceSkill: true,
    },
  });

  if (!service) notFound();

  return {
    editorDto: mapServiceToEditorDto(service, languages),
    languages,
  };
}

export async function getUserServicesWithLanguages(params: DataTableParams) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "type")
      orderBy = { type: sortField.desc ? "desc" : "asc" };
    if (sortField.id === "createdAt")
      orderBy = { createdAt: sortField.desc ? "desc" : "asc" };
  }

  const where = buildServiceListWhere(userId, params.filters);

  const [services, totalCount] = await Promise.all([
    db.service.findMany({
      where,
      include: {
        ServiceTranslation: { include: { language: true } },
        ServiceSkill: { include: { Skill: true } },
      },
      orderBy,
      skip,
      take,
    }),
    db.service.count({ where }),
  ]);

  return {
    data: mapServicesToEditorDto(services, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
