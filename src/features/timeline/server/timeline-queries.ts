import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyTimelineCreateDto,
  mapTimelineToEditorDto,
  mapTimelineToFormDto,
  mapTimelinesToEditorDto,
} from "@/features/timeline/lib/timeline-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma, TimelineCategory } from "@prisma/client";

export async function getTimelineCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyTimelineCreateDto(languages),
    languages,
  };
}

export async function getTimelineEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

  const timelineItemDelegate = (db as { timelineItem?: typeof db.timelineItem })
    .timelineItem;

  const item = timelineItemDelegate
    ? await timelineItemDelegate.findUnique({
        where: { id, userId },
      })
    : null;

  if (!item) notFound();

  return {
    formDto: mapTimelineToFormDto(mapTimelineToEditorDto(item, languages)),
    languages,
  };
}

export async function getUserTimelineWithLanguages(params: DataTableParams) {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const timelineItemDelegate = (db as { timelineItem?: typeof db.timelineItem })
    .timelineItem;

  if (!timelineItemDelegate) {
    return {
      data: [],
      languages,
      pageCount: 1,
      totalCount: 0,
    };
  }

  const skip =
    params.page && params.perPage
      ? (params.page - 1) * params.perPage
      : undefined;
  const take = params.perPage ?? undefined;

  let orderBy:
    | Prisma.TimelineItemOrderByWithRelationInput
    | Prisma.TimelineItemOrderByWithRelationInput[] = [
    { startDate: "desc" },
    { createdAt: "desc" },
  ];
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "category")
      orderBy = { category: sortField.desc ? "desc" : "asc" };
    if (sortField.id === "startDate")
      orderBy = { startDate: sortField.desc ? "desc" : "asc" };
    if (sortField.id === "organization")
      orderBy = { organization: sortField.desc ? "desc" : "asc" };
  }

  const where: Prisma.TimelineItemWhereInput = { userId: userId! };
  if (params.filters && params.filters.length > 0) {
    const orgFilter = params.filters.find((f) => f.id === "organization");
    if (orgFilter && typeof orgFilter.value === "string") {
      where.organization = { contains: orgFilter.value, mode: "insensitive" };
    }
    const categoryFilter = params.filters.find((f) => f.id === "category");
    if (categoryFilter && typeof categoryFilter.value === "string") {
      where.category = categoryFilter.value as TimelineCategory;
    }
  }

  const [items, totalCount] = await Promise.all([
    timelineItemDelegate.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    timelineItemDelegate.count({ where }),
  ]);

  return {
    data: mapTimelinesToEditorDto(items, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
