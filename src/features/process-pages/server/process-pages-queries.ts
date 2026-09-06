import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import {
  buildEmptyProcessPageCreateDto,
  mapProcessPageToEditorDto,
  mapProcessPagesToEditorDto,
} from "@/features/process-pages/lib/process-page-editor-dto";
export async function getProcessPageCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyProcessPageCreateDto(languages),
    languages,
  };
}

export async function getProcessPageEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const page = await db.processPage.findUnique({
    where: { id, userId },
    include: { ProcessPageTranslation: true },
  });
  if (!page) notFound();

  return {
    editorDto: mapProcessPageToEditorDto(page, languages),
    languages,
  };
}

export async function getUserProcessPagesWithLanguages(
  params: DataTableParams,
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

  const [pages, totalCount] = await Promise.all([
    db.processPage.findMany({
      where: { userId },
      include: { ProcessPageTranslation: true },
      orderBy: { order: "asc" },
      skip,
      take,
    }),
    db.processPage.count({ where: { userId } }),
  ]);

  return {
    data: mapProcessPagesToEditorDto(pages, languages),
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
    languages,
  };
}
