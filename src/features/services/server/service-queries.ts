import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyServiceCreateDto,
  mapServiceToEditorDto,
  mapServicesToEditorDto,
} from "@/features/services/lib/service-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma, StackType } from "@prisma/client";

export async function getServiceCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyServiceCreateDto(languages),
    languages,
  };
}

export async function getServiceEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

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
    getAuthenticatedUserId(),
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

  const where: Prisma.ServiceWhereInput = { userId: userId! };
  if (params.filters && params.filters.length > 0) {
    const titleFilter = params.filters.find((f) => f.id === "title");
    if (titleFilter && typeof titleFilter.value === "string") {
      where.ServiceTranslation = {
        some: { title: { contains: titleFilter.value, mode: "insensitive" } },
      };
    }
    const typeFilter = params.filters.find((f) => f.id === "type");
    if (typeFilter && typeof typeFilter.value === "string") {
      where.type = typeFilter.value as StackType;
    }
  }

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
