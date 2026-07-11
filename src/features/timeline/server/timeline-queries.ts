import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyTimelineCreateDto,
  mapTimelineToEditorDto,
  mapTimelineToFormDto,
  mapTimelinesToEditorDto,
} from "@/features/timeline/lib/timeline-editor-dto";

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

export async function getUserTimelineWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const timelineItemDelegate = (db as { timelineItem?: typeof db.timelineItem })
    .timelineItem;

  const items = timelineItemDelegate
    ? await timelineItemDelegate.findMany({
        where: { userId: userId! },
        orderBy: [{ order: "asc" }, { startDate: "desc" }],
      })
    : [];

  return {
    data: mapTimelinesToEditorDto(items, languages),
    languages,
  };
}
