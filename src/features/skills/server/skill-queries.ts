import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptySkillCreateDto,
  mapSkillToEditorDto,
  mapSkillsToEditorDto,
} from "@/features/skills/lib/skill-editor-dto";

export async function getSkillCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  return {
    initialData: buildEmptySkillCreateDto(languages),
    languages,
  };
}

export async function getSkillEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

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

export async function getUserSkillsWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const skills = await db.skill.findMany({
    where: { userId: userId! },
    include: {
      SkillTranslation: { include: { language: true } },
      _count: { select: { ProjectSkill: true, CertificateSkill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: mapSkillsToEditorDto(skills, languages),
    languages,
  };
}
