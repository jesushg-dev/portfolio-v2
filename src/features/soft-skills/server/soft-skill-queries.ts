import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptySoftSkillCreateDto,
  mapSoftSkillToEditorDto,
  mapSoftSkillsToEditorDto,
} from "@/features/soft-skills/lib/soft-skill-editor-dto";

export async function getSoftSkillCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptySoftSkillCreateDto(languages),
    languages,
  };
}

export async function getSoftSkillEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

  const item = await db.portfolioSoftSkill.findUnique({
    where: { id, userId },
  });

  if (!item) notFound();

  return {
    editorDto: mapSoftSkillToEditorDto(item, languages),
    languages,
  };
}

export async function getUserSoftSkillsWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const items = await db.portfolioSoftSkill.findMany({
    where: { userId: userId! },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return {
    data: mapSoftSkillsToEditorDto(items, languages),
    languages,
  };
}
