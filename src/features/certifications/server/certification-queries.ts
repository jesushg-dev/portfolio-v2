import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import { getAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  mapCertificationToEditorDto,
  mapCertificationsToEditorDto,
  type CertificationCreateFormDTO,
} from "@/features/certifications/lib/certification-editor-dto";

export async function getCertificationCreatePageData() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const initialData: CertificationCreateFormDTO = {
    company: "",
    issuedDate: undefined,
    url: "",
    idCredential: "",
    image: "",
    type: [],
    skillIds: [],
    translations: buildEmptyTranslationMap(languages, { title: "" }),
  };

  return { initialData, languages };
}

export async function getCertificationEditPageData(id: string) {
  const [userId, languages] = await Promise.all([
    getAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!userId) return null;

  const certification = await db.certification.findUnique({
    where: { id, userId },
    include: {
      CertificationTranslation: true,
      CertificateSkill: true,
    },
  });

  if (!certification) notFound();

  return {
    editorDto: mapCertificationToEditorDto(certification, languages),
    languages,
  };
}

export async function getUserCertificationsWithLanguages() {
  const [languages, userId] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getAuthenticatedUserId(),
  ]);

  const certifications = await db.certification.findMany({
    where: { userId: userId! },
    include: {
      CertificationTranslation: { include: { language: true } },
      CertificateSkill: { include: { Skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: mapCertificationsToEditorDto(certifications, languages),
    languages,
  };
}
