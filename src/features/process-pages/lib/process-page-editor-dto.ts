import type {
  ProcessPage,
  ProcessPageTemplate,
  ProcessPageTranslation,
} from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";
import {
  emptyProcessPageContent,
  flattenProcessPageCopy,
  hydrateProcessPageContent,
  parseProcessPageContent,
  type ProcessPageContent,
  type ProcessPageIconName,
} from "@/features/process-pages/lib/process-page-content";

export interface ProcessPageTranslationFields {
  metaTitle: string;
  metaDescription: string;
  menuTitle: string;
  navDescription: string;
  pageNavLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroScrollHint: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
}

export type ProcessPageTranslationMap =
  TranslationMap<ProcessPageTranslationFields>;

export type ProcessPageContentByLanguage = Record<string, ProcessPageContent>;

export interface ProcessPageEditorDTO {
  id: string;
  slug: string;
  template: ProcessPageTemplate;
  isPublished: boolean;
  showInNav: boolean;
  order: number;
  navIcon: ProcessPageIconName;
  translations: ProcessPageTranslationMap;
  contentByLanguage: ProcessPageContentByLanguage;
}

export type ProcessPageCreateFormDTO = Omit<ProcessPageEditorDTO, "id">;

export type ProcessPageFormValues = ProcessPageCreateFormDTO & { id?: string };

export const emptyProcessPageTranslationFields: ProcessPageTranslationFields = {
  metaTitle: "",
  metaDescription: "",
  menuTitle: "",
  navDescription: "",
  pageNavLabel: "",
  heroEyebrow: "",
  heroTitle: "",
  heroTitleHighlight: "",
  heroDescription: "",
  heroPrimaryCta: "",
  heroSecondaryCta: "",
  heroScrollHint: "",
  ctaTitle: "",
  ctaDescription: "",
  ctaButton: "",
};

type ProcessPageWithTranslations = ProcessPage & {
  ProcessPageTranslation: ProcessPageTranslation[];
};

export function mapProcessPageToEditorDto(
  page: ProcessPageWithTranslations,
  languages: LanguageRef[],
): ProcessPageEditorDTO {
  const rows =
    page.ProcessPageTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      metaTitle: translation.metaTitle ?? "",
      metaDescription: translation.metaDescription ?? "",
      menuTitle: translation.menuTitle ?? "",
      navDescription: translation.navDescription ?? "",
      pageNavLabel: translation.pageNavLabel ?? "",
      heroEyebrow: translation.heroEyebrow ?? "",
      heroTitle: translation.heroTitle ?? "",
      heroTitleHighlight: translation.heroTitleHighlight ?? "",
      heroDescription: translation.heroDescription ?? "",
      heroPrimaryCta: translation.heroPrimaryCta ?? "",
      heroSecondaryCta: translation.heroSecondaryCta ?? "",
      heroScrollHint: translation.heroScrollHint ?? "",
      ctaTitle: translation.ctaTitle ?? "",
      ctaDescription: translation.ctaDescription ?? "",
      ctaButton: translation.ctaButton ?? "",
    })) ?? [];

  const contentByLanguage: ProcessPageContentByLanguage = {};
  for (const language of languages) {
    const row = page.ProcessPageTranslation?.find(
      (translation) => translation.appLanguageId === language.id,
    );
    const parsed = parseProcessPageContent(row?.content, page.template);
    contentByLanguage[language.id] = hydrateProcessPageContent(
      parsed,
      row
        ? {
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
          }
        : emptyProcessPageTranslationFields,
    );
  }

  return {
    id: page.id,
    slug: page.slug,
    template: page.template,
    isPublished: page.isPublished,
    showInNav: page.showInNav,
    order: page.order,
    navIcon: (page.navIcon as ProcessPageIconName) || "Bot",
    translations: mergeTranslationMap(
      languages,
      rows,
      emptyProcessPageTranslationFields,
    ),
    contentByLanguage,
  };
}

export function mapProcessPagesToEditorDto(
  pages: ProcessPageWithTranslations[],
  languages: LanguageRef[],
): ProcessPageEditorDTO[] {
  return pages.map((page) => mapProcessPageToEditorDto(page, languages));
}

export function buildEmptyProcessPageCreateDto(
  languages: LanguageRef[],
): ProcessPageCreateFormDTO {
  const contentByLanguage: ProcessPageContentByLanguage = {};
  for (const language of languages) {
    contentByLanguage[language.id] = emptyProcessPageContent();
  }

  return {
    slug: "",
    template: "WORKFLOW",
    isPublished: false,
    showInNav: false,
    order: 0,
    navIcon: "Bot",
    translations: buildEmptyTranslationMap(
      languages,
      emptyProcessPageTranslationFields,
    ),
    contentByLanguage,
  };
}

export function mergeCopyIntoTranslations(
  translations: ProcessPageTranslationMap,
  contentByLanguage: ProcessPageContentByLanguage,
): ProcessPageTranslationMap {
  const next = { ...translations };
  for (const [languageId, content] of Object.entries(contentByLanguage)) {
    const copy = flattenProcessPageCopy(content);
    next[languageId] = {
      ...emptyProcessPageTranslationFields,
      ...next[languageId],
      ...copy,
    };
  }
  return next;
}
