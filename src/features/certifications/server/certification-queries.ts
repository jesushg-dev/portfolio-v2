import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import { requireAuthenticatedUserId } from "@/lib/admin/get-authenticated-user-id";
import {
  mapCertificationToEditorDto,
  mapCertificationsToEditorDto,
  type CertificationCreateFormDTO,
} from "@/features/certifications/lib/certification-editor-dto";
import type { DataTableParams } from "@/lib/admin/data-table-schemas";
import type { Prisma } from "@prisma/client";

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
    requireAuthenticatedUserId(),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

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

export async function getUserCertificationsWithLanguages(
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

  let orderBy: Prisma.CertificationOrderByWithRelationInput = {
    createdAt: "desc",
  };
  if (params.sort && params.sort.length > 0) {
    const sortField = params.sort[0];
    if (sortField.id === "company")
      orderBy = { company: sortField.desc ? "desc" : "asc" };
    if (sortField.id === "createdAt")
      orderBy = { createdAt: sortField.desc ? "desc" : "asc" };
  }

  const where: Prisma.CertificationWhereInput = { userId };
  if (params.filters && params.filters.length > 0) {
    const titleFilter = params.filters.find((f) => f.id === "title");
    if (titleFilter && typeof titleFilter.value === "string") {
      where.CertificationTranslation = {
        some: { title: { contains: titleFilter.value, mode: "insensitive" } },
      };
    }
    const companyFilter = params.filters.find((f) => f.id === "company");
    if (companyFilter && typeof companyFilter.value === "string") {
      where.company = { contains: companyFilter.value, mode: "insensitive" };
    }
  }

  const [certifications, totalCount] = await Promise.all([
    db.certification.findMany({
      where,
      include: {
        CertificationTranslation: { include: { language: true } },
        CertificateSkill: { include: { Skill: true } },
      },
      orderBy,
      skip,
      take,
    }),
    db.certification.count({ where }),
  ]);

  return {
    data: mapCertificationsToEditorDto(certifications, languages),
    languages,
    pageCount: take ? Math.ceil(totalCount / take) : 1,
    totalCount,
  };
}
