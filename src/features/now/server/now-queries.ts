import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyNowFocusCreateDto,
  mapNowFocusToEditorDto,
  mapNowFocusesToEditorDto,
  mapNowSettingsToEditorDto,
} from "@/features/now/lib/now-editor-dto";

export async function getNowAdminPageData() {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  let settings = await db.nowSettings.findUnique({
    where: { userId },
    include: { NowSettingsTranslation: true },
  });

  settings ??= await db.nowSettings.create({
    data: {
      userId,
      NowSettingsTranslation: {
        createMany: {
          data: languages.map((lang) => ({
            appLanguageId: lang.id,
            statusBody: "",
            statusRelative: "",
            githubBody: "",
            githubRelative: "",
          })),
        },
      },
    },
    include: { NowSettingsTranslation: true },
  });

  const focuses = await db.nowFocus.findMany({
    where: { userId },
    include: { NowFocusTranslation: true },
    orderBy: { order: "asc" },
  });

  return {
    settings: mapNowSettingsToEditorDto(settings, languages),
    focuses: mapNowFocusesToEditorDto(focuses, languages),
    languages,
  };
}

export async function getNowFocusCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptyNowFocusCreateDto(languages),
    languages,
  };
}

export async function getNowFocusEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  const focus = await db.nowFocus.findUnique({
    where: { id, userId },
    include: { NowFocusTranslation: true },
  });
  if (!focus) notFound();

  return {
    editorDto: mapNowFocusToEditorDto(focus, languages),
    languages,
  };
}
