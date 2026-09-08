import type {
  AppLanguage,
  PrismaClient,
  ProcessPageTranslation,
} from "@prisma/client";

import {
  hydrateProcessPageContent,
  parseProcessPageContent,
} from "@/features/process-pages/lib/process-page-content";
import {
  emptyProcessPageTranslationFields,
  type ProcessPageTranslationFields,
} from "@/features/process-pages/lib/process-page-editor-dto";

export interface ProcessPagesQueryDb {
  appLanguage: Pick<PrismaClient["appLanguage"], "findMany">;
  processPage: Pick<PrismaClient["processPage"], "findFirst">;
}

export function pickProcessPageTranslation(
  rows: ProcessPageTranslation[],
  languages: AppLanguage[],
  locale: string,
): ProcessPageTranslation | undefined {
  const requested = languages.find((language) => language.code === locale);
  const english = languages.find((language) => language.code === "en");
  return (
    rows.find((row) => row.appLanguageId === requested?.id) ??
    rows.find((row) => row.appLanguageId === english?.id) ??
    rows[0]
  );
}

export function processPageTranslationFields(
  row: ProcessPageTranslation | undefined,
): ProcessPageTranslationFields {
  if (!row) return emptyProcessPageTranslationFields;
  return {
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    menuTitle: row.menuTitle ?? "",
    navDescription: row.navDescription ?? "",
    pageNavLabel: row.pageNavLabel ?? "",
    heroEyebrow: row.heroEyebrow ?? "",
    heroTitle: row.heroTitle ?? "",
    heroTitleHighlight: row.heroTitleHighlight ?? "",
    heroDescription: row.heroDescription ?? "",
    heroPrimaryCta: row.heroPrimaryCta ?? "",
    heroSecondaryCta: row.heroSecondaryCta ?? "",
    heroScrollHint: row.heroScrollHint ?? "",
    ctaTitle: row.ctaTitle ?? "",
    ctaDescription: row.ctaDescription ?? "",
    ctaButton: row.ctaButton ?? "",
  };
}

/** Public getBySlug: unpublished or missing pages return null (route maps that to 404). */
export async function getPublishedProcessPageBySlug(
  db: ProcessPagesQueryDb,
  tenantUserId: string | null,
  slug: string,
  locale: string,
) {
  if (!tenantUserId) return null;

  const [languages, page] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.processPage.findFirst({
      where: {
        userId: tenantUserId,
        slug,
        isPublished: true,
      },
      include: { ProcessPageTranslation: true },
    }),
  ]);

  if (!page) return null;

  const translation = pickProcessPageTranslation(
    page.ProcessPageTranslation,
    languages,
    locale,
  );
  if (!translation) return null;

  const fields = processPageTranslationFields(translation);

  return {
    id: page.id,
    slug: page.slug,
    template: page.template,
    navIcon: page.navIcon,
    order: page.order,
    showInNav: page.showInNav,
    ...fields,
    content: hydrateProcessPageContent(
      parseProcessPageContent(translation.content, page.template),
      fields,
    ),
  };
}
