import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  buildEmptyServiceCreateDto,
  mapServiceToEditorDto,
  mapServicesToEditorDto,
} from "@/features/services/lib/service-editor-dto";

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

export async function getUserServicesWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const services = await db.service.findMany({
    where: { userId: userId! },
    include: {
      ServiceTranslation: { include: { language: true } },
      ServiceSkill: { include: { Skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: mapServicesToEditorDto(services, languages),
    languages,
  };
}
