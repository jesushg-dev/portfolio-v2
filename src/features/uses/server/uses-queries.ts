import { notFound } from "next/navigation";
import type { UsesItemType } from "@prisma/client";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyUsesItemCreateDto,
  mapUsesItemToEditorDto,
  mapUsesItemsToEditorDto,
  mapUsesSettingsToEditorDto,
} from "@/features/uses/lib/uses-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";

export async function getUsesItemCreatePageData(type: UsesItemType) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyUsesItemCreateDto(languages, type),
    languages,
  };
}

export async function getUsesItemEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const item = await db.usesItem.findUnique({
    where: { id, userId },
    include: { UsesItemTranslation: true },
  });
  if (!item) notFound();

  return {
    editorDto: mapUsesItemToEditorDto(item, languages),
    languages,
  };
}

export async function getUserUsesItemsWithLanguages(
  params: DataTableParams & { type?: UsesItemType },
) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    requireAuthenticatedUserId(),
  ]);

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  const where = {
    userId,
    ...(params.type ? { type: params.type } : {}),
  };

  const [items, totalCount] = await Promise.all([
    db.usesItem.findMany({
      where,
      include: { UsesItemTranslation: true },
      orderBy: { order: "asc" },
      skip,
      take,
    }),
    db.usesItem.count({ where }),
  ]);

  return {
    data: mapUsesItemsToEditorDto(items, languages),
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
    languages,
  };
}

export async function getUsesSettingsPageData() {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const existing = await db.usesSettings.findUnique({
    where: { userId },
    include: {
      UsesSettingsTranslation: true,
      UsesClarification: {
        orderBy: { order: "asc" },
        include: { UsesClarificationTranslation: true },
      },
    },
  });

  if (existing) {
    return {
      settings: mapUsesSettingsToEditorDto(existing, languages),
      languages,
    };
  }

  const created = await db.usesSettings.create({
    data: { userId },
    include: {
      UsesSettingsTranslation: true,
      UsesClarification: {
        orderBy: { order: "asc" },
        include: { UsesClarificationTranslation: true },
      },
    },
  });

  return {
    settings: mapUsesSettingsToEditorDto(created, languages),
    languages,
  };
}
