import type {
  Certification,
  CertificationTranslation,
  CertificateSkill,
} from "@prisma/client";

import {
  type TranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";
import type { LanguageRef } from "@/lib/i18n/editor-rows";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CertificationTranslationFields = {
  title: string;
};

export type CertificationTranslationMap =
  TranslationMap<CertificationTranslationFields>;

export type CertificationEditorDTO = {
  id: string;
  company: string;
  issuedDate: number | undefined;
  url: string;
  idCredential: string;
  image: string;
  type: Certification["type"];
  skillIds: string[];
  translations: CertificationTranslationMap;
};

export type CertificationCreateFormDTO = Omit<CertificationEditorDTO, "id">;

// ─── Prisma → DTO ────────────────────────────────────────────────────────────

type CertificationWithRelations = Certification & {
  CertificationTranslation: CertificationTranslation[];
  CertificateSkill: CertificateSkill[];
};

export function mapCertificationToEditorDto(
  certification: CertificationWithRelations,
  languages: LanguageRef[],
): CertificationEditorDTO {
  const rows =
    certification.CertificationTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      title: translation.title,
    })) ?? [];

  return {
    id: certification.id,
    company: certification.company,
    issuedDate: certification.issuedDate ?? undefined,
    url: certification.url ?? "",
    idCredential: certification.idCredential ?? "",
    image: certification.image ?? "",
    type: certification.type,
    skillIds:
      certification.CertificateSkill?.map((entry) => entry.skillId) ?? [],
    translations: mergeTranslationMap<CertificationTranslationFields>(
      languages,
      rows,
      { title: "" },
    ),
  };
}

export function mapCertificationsToEditorDto(
  certifications: CertificationWithRelations[],
  languages: LanguageRef[],
): CertificationEditorDTO[] {
  return certifications.map((c) => mapCertificationToEditorDto(c, languages));
}
