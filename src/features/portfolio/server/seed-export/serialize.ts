import type { LanguageRef } from "@/lib/i18n/editor-rows";
import type {
  ProcessPageTemplate,
  ProjectKind,
  SoftSkillsMediaType,
  StackType,
  TimelineCategory,
  UsesItemType,
} from "@prisma/client";

import {
  parseProcessPageContent,
  type ProcessPageContent,
} from "@/features/process-pages/lib/process-page-content";

import {
  certificationsCatalog,
  processPagesCatalog,
  projectsCatalog,
  servicesCatalog,
  skillsCatalog,
  timelineCatalog,
  type CertificationSeedRecord,
  type NowSeedRecord,
  type ProcessPageSeedRecord,
  type ProjectSeedRecord,
  type ServiceSeedRecord,
  type SkillSeedRecord,
  type SoftSkillsSeedRecord,
  type TimelineItemSeedRecord,
  type UsesSeedRecord,
} from "./catalog";
import {
  pascalFromSlug,
  slugFromKey,
  sortByCatalogOrder,
  toKebabKey,
  toPascalKey,
  uniqueKey,
} from "./keys";
import {
  englishText,
  localeMapFromRows,
  TIMELINE_MAP_LOCALES,
  translationArray,
} from "./locales";

export function stringifySeedJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function toDateOnly(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function emptyToBlank(value: string | null | undefined): string {
  return value ?? "";
}

interface TranslationRow {
  appLanguageId: string;
}

export interface SkillExportRow {
  title: string;
  type: StackType;
  image: string;
  featured: boolean;
  SkillTranslation: (TranslationRow & {
    description: string;
    urlWiki: string;
  })[];
}

export interface ProjectExportRow {
  image: string;
  type: StackType;
  githubUrl: string | null;
  websiteUrl: string | null;
  isPrivate: boolean;
  order: number;
  kind: ProjectKind;
  slug: string | null;
  caseStudyEnabled: boolean;
  ProjectTranslation: (TranslationRow & {
    title: string;
    description: string;
    hook: string | null;
    challenge: string | null;
    approach: string | null;
    outcome: string | null;
  })[];
  ProjectSkill: { Skill: { title: string } }[];
}

export interface ServiceExportRow {
  type: StackType;
  icon: string | null;
  statsValue: string | null;
  featured: boolean;
  isActive: boolean;
  order: number;
  image: string;
  ServiceTranslation: (TranslationRow & {
    title: string;
    description: string;
    badge: string | null;
    statsLabel: string | null;
  })[];
}

export interface CertificationExportRow {
  company: string;
  issuedDate: number | null;
  url: string | null;
  idCredential: string | null;
  image: string | null;
  type: StackType[];
  CertificationTranslation: (TranslationRow & { title: string })[];
  CertificateSkill: { Skill: { title: string } }[];
}

export interface TimelineExportRow {
  category: TimelineCategory;
  organization: string;
  location: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  current: boolean;
  images: string[];
  TimelineItemTranslation: (TranslationRow & {
    title: string;
    description: string;
  })[];
}

export interface SoftSkillExportRow {
  icon: string;
  featured: boolean;
  order: number;
  PortfolioSoftSkillTranslation: (TranslationRow & {
    title: string;
    description: string;
    badge: string | null;
  })[];
}

export interface SoftSkillsSectionExportRow {
  mediaType: SoftSkillsMediaType;
  videoUrl: string | null;
  posterUrl: string | null;
  imageUrl: string | null;
}

export interface UsesItemExportRow {
  type: UsesItemType;
  href: string;
  image: string | null;
  order: number;
  UsesItemTranslation: (TranslationRow & {
    title: string;
    description: string | null;
  })[];
}

export interface UsesSettingsExportRow {
  workspaceImage: string | null;
  codingPreviewLight: string | null;
  codingPreviewDark: string | null;
  UsesSettingsTranslation: (TranslationRow & {
    codingIntro: string;
    browserIntro: string;
  })[];
  UsesClarification: {
    order: number;
    UsesClarificationTranslation: (TranslationRow & { body: string })[];
  }[];
  UsesWorkspaceTag: {
    order: number;
    xPercent: number;
    yPercent: number;
    UsesItem: { href: string };
  }[];
}

export interface NowSettingsExportRow {
  timezone: string;
  githubUsername: string | null;
  statusEmoji: string | null;
  readingTitle: string | null;
  readingAuthors: string | null;
  readingProgress: number;
  watchedTitle: string | null;
  watchedRating: number;
  githubRepo: string | null;
  githubHref: string | null;
  photoUrls: string[];
  NowSettingsTranslation: (TranslationRow & {
    statusBody: string;
    statusRelative: string;
    githubBody: string;
    githubRelative: string;
  })[];
}

export interface NowFocusExportRow {
  order: number;
  NowFocusTranslation: (TranslationRow & {
    label: string;
    body: string;
  })[];
}

export interface ProcessPageExportRow {
  slug: string;
  template: ProcessPageTemplate;
  isPublished: boolean;
  showInNav: boolean;
  order: number;
  navIcon: string;
  ProcessPageTranslation: (TranslationRow & {
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
    content: unknown;
  })[];
}

export function buildSkillKeyByTitle(
  skills: { title: string }[],
): Map<string, string> {
  const used = new Set<string>();
  const map = new Map<string, string>();
  for (const catalogSkill of skillsCatalog) {
    const match = skills.find((skill) => skill.title === catalogSkill.title);
    if (!match || map.has(match.title)) continue;
    map.set(match.title, uniqueKey(catalogSkill.key, used));
  }
  for (const skill of skills) {
    if (map.has(skill.title)) continue;
    map.set(skill.title, uniqueKey(toPascalKey(skill.title), used));
  }
  return map;
}

export function serializeSkills(
  skills: SkillExportRow[],
  languages: LanguageRef[],
): SkillSeedRecord[] {
  const keyByTitle = buildSkillKeyByTitle(skills);
  const records = skills.map((skill) => {
    const record: SkillSeedRecord = {
      key: keyByTitle.get(skill.title) ?? toPascalKey(skill.title),
      title: skill.title,
      type: skill.type,
      image: skill.image,
      translations: translationArray(
        skill.SkillTranslation,
        languages,
        (row, locale) => ({
          locale,
          description: row.description,
          urlWiki: row.urlWiki,
        }),
      ),
      featured: skill.featured,
    };
    return record;
  });
  return sortByCatalogOrder(
    records,
    (item) => item.key,
    skillsCatalog.map((item) => item.key),
  );
}

function resolveProjectKey(
  project: ProjectExportRow,
  languages: LanguageRef[],
  used: Set<string>,
): string {
  const slug = project.slug?.trim() ?? "";
  const enTitle = englishText(
    project.ProjectTranslation,
    languages,
    (row) => row.title,
  );
  const bySlug = projectsCatalog.find((item) => {
    const catalogSlug = item.slug ?? slugFromKey(item.key);
    return slug !== "" && catalogSlug === slug && !used.has(item.key);
  });
  if (bySlug) return uniqueKey(bySlug.key, used);

  const byTitle = projectsCatalog.find((item) => {
    const catalogTitle = item.translations.find(
      (translation) => translation.locale === "en",
    )?.title;
    return Boolean(enTitle) && catalogTitle === enTitle && !used.has(item.key);
  });
  if (byTitle) return uniqueKey(byTitle.key, used);

  if (slug) return uniqueKey(pascalFromSlug(slug), used);
  return uniqueKey(toPascalKey(enTitle || "Project"), used);
}

function optionalCaseStudyFields(row: {
  hook: string | null;
  challenge: string | null;
  approach: string | null;
  outcome: string | null;
}): Pick<
  ProjectSeedRecord["translations"][number],
  "hook" | "challenge" | "approach" | "outcome"
> {
  const hook = row.hook?.trim() ?? "";
  const challenge = row.challenge?.trim() ?? "";
  const approach = row.approach?.trim() ?? "";
  const outcome = row.outcome?.trim() ?? "";
  if (!hook && !challenge && !approach && !outcome) return {};
  return { hook, challenge, approach, outcome };
}

export function serializeProjects(
  projects: ProjectExportRow[],
  languages: LanguageRef[],
  skillKeyByTitle: Map<string, string>,
): ProjectSeedRecord[] {
  const used = new Set<string>();
  const records = projects.map((project) => {
    const key = resolveProjectKey(project, languages, used);
    const trimmedSlug = project.slug?.trim() ?? "";
    const slug = trimmedSlug.length > 0 ? trimmedSlug : slugFromKey(key);
    const record: ProjectSeedRecord = {
      key,
      image: project.image,
      type: project.type,
      githubUrl: emptyToBlank(project.githubUrl),
      websiteUrl: emptyToBlank(project.websiteUrl),
      isPrivate: project.isPrivate,
      slug,
      ...(project.caseStudyEnabled ? { caseStudyEnabled: true } : {}),
      translations: translationArray(
        project.ProjectTranslation,
        languages,
        (row, locale) => ({
          locale,
          title: row.title,
          description: row.description,
          ...optionalCaseStudyFields(row),
        }),
      ),
      skillKeys: project.ProjectSkill.map(
        (join) =>
          skillKeyByTitle.get(join.Skill.title) ??
          toPascalKey(join.Skill.title),
      ),
      order: project.order,
      kind: project.kind,
    };
    return record;
  });
  return sortByCatalogOrder(
    records,
    (item) => item.key,
    projectsCatalog.map((item) => item.key),
  );
}

function resolveServiceKey(
  service: ServiceExportRow,
  languages: LanguageRef[],
  used: Set<string>,
): string {
  const enTitle = englishText(
    service.ServiceTranslation,
    languages,
    (row) => row.title,
  );
  const byTypeAndTitle = servicesCatalog.find((item) => {
    const catalogTitle = item.translations.find(
      (translation) => translation.locale === "en",
    )?.title;
    return (
      item.type === service.type &&
      catalogTitle === enTitle &&
      !used.has(item.key)
    );
  });
  if (byTypeAndTitle) return uniqueKey(byTypeAndTitle.key, used);

  const byType = servicesCatalog.find(
    (item) => item.type === service.type && !used.has(item.key),
  );
  if (byType) return uniqueKey(byType.key, used);

  return uniqueKey(toKebabKey(enTitle || service.type.toLowerCase()), used);
}

export function serializeServices(
  services: ServiceExportRow[],
  languages: LanguageRef[],
): ServiceSeedRecord[] {
  const used = new Set<string>();
  const records = services.map((service) => {
    const record: ServiceSeedRecord = {
      key: resolveServiceKey(service, languages, used),
      type: service.type,
      icon: service.icon ?? "code",
      statsValue: emptyToBlank(service.statsValue),
      featured: service.featured,
      order: service.order,
      image: service.image,
      translations: translationArray(
        service.ServiceTranslation,
        languages,
        (row, locale) => ({
          locale,
          title: row.title,
          description: row.description,
          badge: emptyToBlank(row.badge),
          statsLabel: emptyToBlank(row.statsLabel),
        }),
      ),
    };
    if (service.isActive === false) {
      record.isActive = false;
    }
    return record;
  });
  return sortByCatalogOrder(
    records,
    (item) => item.key,
    servicesCatalog.map((item) => item.key),
  );
}

function resolveCertificationKey(
  certification: CertificationExportRow,
  languages: LanguageRef[],
  used: Set<string>,
): string {
  const credential = certification.idCredential?.trim() ?? "";
  const url = certification.url?.trim() ?? "";
  const enTitle = englishText(
    certification.CertificationTranslation,
    languages,
    (row) => row.title,
  );

  if (credential) {
    const byCredential = certificationsCatalog.find(
      (item) => item.idCredential === credential && !used.has(item.key),
    );
    if (byCredential) return uniqueKey(byCredential.key, used);
  }

  if (url) {
    const byUrl = certificationsCatalog.find(
      (item) => item.url === url && !used.has(item.key),
    );
    if (byUrl) return uniqueKey(byUrl.key, used);
  }

  const byCompanyTitle = certificationsCatalog.find((item) => {
    const catalogTitle = item.translations.find(
      (translation) => translation.locale === "en",
    )?.title;
    return (
      item.company === certification.company &&
      catalogTitle === enTitle &&
      !used.has(item.key)
    );
  });
  if (byCompanyTitle) return uniqueKey(byCompanyTitle.key, used);

  const slugSource = `${certification.company} ${enTitle}`.trim();
  return uniqueKey(toKebabKey(slugSource || "certification"), used);
}

export function serializeCertifications(
  certifications: CertificationExportRow[],
  languages: LanguageRef[],
  skillKeyByTitle: Map<string, string>,
): CertificationSeedRecord[] {
  const used = new Set<string>();
  const records = certifications.map((certification) => {
    const record: CertificationSeedRecord = {
      key: resolveCertificationKey(certification, languages, used),
      company: certification.company,
      issuedDate: certification.issuedDate,
      url: emptyToBlank(certification.url),
      idCredential: emptyToBlank(certification.idCredential),
      image: emptyToBlank(certification.image),
      type: certification.type[0] ?? "TOOLS",
      skillKeys: certification.CertificateSkill.map(
        (join) =>
          skillKeyByTitle.get(join.Skill.title) ??
          toPascalKey(join.Skill.title),
      ),
      translations: translationArray(
        certification.CertificationTranslation,
        languages,
        (row, locale) => ({
          locale,
          title: row.title,
        }),
      ),
    };
    return record;
  });
  return sortByCatalogOrder(
    records,
    (item) => item.key,
    certificationsCatalog.map((item) => item.key),
  );
}

function resolveTimelineKey(
  item: TimelineExportRow,
  languages: LanguageRef[],
  used: Set<string>,
): string {
  const startDate = toDateOnly(item.startDate);
  const match = timelineCatalog.items.find(
    (catalogItem) =>
      catalogItem.organization === item.organization &&
      catalogItem.startDate === startDate &&
      catalogItem.category === item.category &&
      !used.has(catalogItem.key),
  );
  if (match) return uniqueKey(match.key, used);

  const enTitle = englishText(
    item.TimelineItemTranslation,
    languages,
    (row) => row.title,
  );
  const prefix = item.category.toLowerCase();
  return uniqueKey(
    toKebabKey(`${prefix} ${enTitle || item.organization}`),
    used,
  );
}

export function serializeTimeline(
  items: TimelineExportRow[],
  languages: LanguageRef[],
): { items: TimelineItemSeedRecord[] } {
  const used = new Set<string>();
  const records = items.map((item) => {
    const record: TimelineItemSeedRecord = {
      key: resolveTimelineKey(item, languages, used),
      title: localeMapFromRows(
        item.TimelineItemTranslation,
        languages,
        (row) => row.title,
        TIMELINE_MAP_LOCALES,
        { includeEmpty: true },
      ),
      description: localeMapFromRows(
        item.TimelineItemTranslation,
        languages,
        (row) => row.description,
        TIMELINE_MAP_LOCALES,
        { includeEmpty: true },
      ),
      category: item.category,
      organization: item.organization,
      location: emptyToBlank(item.location),
      startDate: toDateOnly(item.startDate),
      current: item.current,
      images: item.images.filter((image) => typeof image === "string"),
    };
    if (item.endDate) {
      record.endDate = toDateOnly(item.endDate);
    }
    return record;
  });
  return {
    items: sortByCatalogOrder(
      records,
      (entry) => entry.key,
      timelineCatalog.items.map((entry) => entry.key),
    ),
  };
}

export function serializeSoftSkills(
  section: SoftSkillsSectionExportRow | null,
  items: SoftSkillExportRow[],
  languages: LanguageRef[],
): SoftSkillsSeedRecord {
  const sorted = [...items].sort((left, right) => left.order - right.order);
  return {
    section: {
      mediaType: section?.mediaType ?? "VIDEO",
      videoUrl: section?.videoUrl ?? null,
      posterUrl: section?.posterUrl ?? null,
      imageUrl: section?.imageUrl ?? null,
    },
    items: sorted.map((item) => {
      const badge = localeMapFromRows(
        item.PortfolioSoftSkillTranslation,
        languages,
        (row) => row.badge,
      );
      const record: SoftSkillsSeedRecord["items"][number] = {
        icon: item.icon,
        order: item.order,
        featured: item.featured,
        title: localeMapFromRows(
          item.PortfolioSoftSkillTranslation,
          languages,
          (row) => row.title,
          undefined,
          { includeEmpty: true },
        ),
        description: localeMapFromRows(
          item.PortfolioSoftSkillTranslation,
          languages,
          (row) => row.description,
          undefined,
          { includeEmpty: true },
        ),
      };
      if (Object.keys(badge).length > 0) {
        record.badge = badge;
      }
      return record;
    }),
  };
}

const USES_TYPE_ORDER: UsesItemType[] = ["EVERYDAY", "SOFTWARE", "BROWSER"];

export function serializeUses(
  settings: UsesSettingsExportRow | null,
  items: UsesItemExportRow[],
  languages: LanguageRef[],
): UsesSeedRecord {
  const sortedItems = [...items].sort((left, right) => {
    const typeDelta =
      USES_TYPE_ORDER.indexOf(left.type) - USES_TYPE_ORDER.indexOf(right.type);
    if (typeDelta !== 0) return typeDelta;
    return left.order - right.order;
  });

  const clarifications = [...(settings?.UsesClarification ?? [])].sort(
    (left, right) => left.order - right.order,
  );

  return {
    settings: {
      workspaceImage: emptyToBlank(settings?.workspaceImage),
      codingPreviewLight: emptyToBlank(settings?.codingPreviewLight),
      codingPreviewDark: emptyToBlank(settings?.codingPreviewDark),
      codingIntro: localeMapFromRows(
        settings?.UsesSettingsTranslation ?? [],
        languages,
        (row) => row.codingIntro,
        undefined,
        { includeEmpty: true },
      ),
      browserIntro: localeMapFromRows(
        settings?.UsesSettingsTranslation ?? [],
        languages,
        (row) => row.browserIntro,
        undefined,
        { includeEmpty: true },
      ),
      clarifications: clarifications.map((clarification) => ({
        order: clarification.order,
        body: localeMapFromRows(
          clarification.UsesClarificationTranslation,
          languages,
          (row) => row.body,
          undefined,
          { includeEmpty: true },
        ),
      })),
      workspaceTags: [...(settings?.UsesWorkspaceTag ?? [])]
        .sort((left, right) => left.order - right.order)
        .filter((tag) => tag.UsesItem.href.length > 0)
        .map((tag) => ({
          itemHref: tag.UsesItem.href,
          xPercent: tag.xPercent,
          yPercent: tag.yPercent,
        })),
    },
    items: sortedItems.map((item) => {
      const description = localeMapFromRows(
        item.UsesItemTranslation,
        languages,
        (row) => row.description,
      );
      const record: UsesSeedRecord["items"][number] = {
        type: item.type,
        href: item.href,
        image: item.image,
        order: item.order,
        title: localeMapFromRows(
          item.UsesItemTranslation,
          languages,
          (row) => row.title,
          undefined,
          { includeEmpty: true },
        ),
      };
      if (Object.values(description).some((value) => value)) {
        record.description = description;
      }
      return record;
    }),
  };
}

export function serializeNow(
  settings: NowSettingsExportRow | null,
  focuses: NowFocusExportRow[],
  languages: LanguageRef[],
): NowSeedRecord {
  const sortedFocuses = [...focuses].sort(
    (left, right) => left.order - right.order,
  );
  return {
    settings: {
      timezone: settings?.timezone ?? "America/Mexico_City",
      githubUsername: emptyToBlank(settings?.githubUsername),
      statusEmoji: emptyToBlank(settings?.statusEmoji) || "🚀",
      readingTitle: emptyToBlank(settings?.readingTitle),
      readingAuthors: emptyToBlank(settings?.readingAuthors),
      readingProgress: settings?.readingProgress ?? 0,
      watchedTitle: emptyToBlank(settings?.watchedTitle),
      watchedRating: settings?.watchedRating ?? 0,
      githubRepo: emptyToBlank(settings?.githubRepo),
      githubHref: emptyToBlank(settings?.githubHref),
      photoUrls: settings?.photoUrls ?? [],
      statusBody: localeMapFromRows(
        settings?.NowSettingsTranslation ?? [],
        languages,
        (row) => row.statusBody,
        undefined,
        { includeEmpty: true },
      ),
      statusRelative: localeMapFromRows(
        settings?.NowSettingsTranslation ?? [],
        languages,
        (row) => row.statusRelative,
        undefined,
        { includeEmpty: true },
      ),
      githubBody: localeMapFromRows(
        settings?.NowSettingsTranslation ?? [],
        languages,
        (row) => row.githubBody,
        undefined,
        { includeEmpty: true },
      ),
      githubRelative: localeMapFromRows(
        settings?.NowSettingsTranslation ?? [],
        languages,
        (row) => row.githubRelative,
        undefined,
        { includeEmpty: true },
      ),
    },
    focuses: sortedFocuses.map((focus) => ({
      order: focus.order,
      label: localeMapFromRows(
        focus.NowFocusTranslation,
        languages,
        (row) => row.label,
        undefined,
        { includeEmpty: true },
      ),
      body: localeMapFromRows(
        focus.NowFocusTranslation,
        languages,
        (row) => row.body,
        undefined,
        { includeEmpty: true },
      ),
    })),
  };
}

function resolveProcessPageKey(
  page: ProcessPageExportRow,
  used: Set<string>,
): string {
  const slug = page.slug.trim();
  const bySlug = processPagesCatalog.find(
    (item) => item.slug === slug && !used.has(item.key),
  );
  if (bySlug) return uniqueKey(bySlug.key, used);

  if (slug) return uniqueKey(pascalFromSlug(slug), used);
  return uniqueKey(toPascalKey(page.template.toLowerCase()), used);
}

export function serializeProcessPages(
  pages: ProcessPageExportRow[],
  languages: LanguageRef[],
): ProcessPageSeedRecord[] {
  const used = new Set<string>();
  const records = pages.map((page) => {
    const record: ProcessPageSeedRecord = {
      key: resolveProcessPageKey(page, used),
      slug: page.slug.trim(),
      template: page.template,
      navIcon: page.navIcon || "Bot",
      order: page.order,
      isPublished: page.isPublished,
      showInNav: page.showInNav,
      translations: translationArray(
        page.ProcessPageTranslation,
        languages,
        (row, locale) => {
          const content: ProcessPageContent = parseProcessPageContent(
            row.content,
            page.template,
          );
          return {
            locale,
            metaTitle: emptyToBlank(row.metaTitle),
            metaDescription: emptyToBlank(row.metaDescription),
            menuTitle: emptyToBlank(row.menuTitle),
            navDescription: emptyToBlank(row.navDescription),
            pageNavLabel: emptyToBlank(row.pageNavLabel),
            heroEyebrow: emptyToBlank(row.heroEyebrow),
            heroTitle: emptyToBlank(row.heroTitle),
            heroTitleHighlight: emptyToBlank(row.heroTitleHighlight),
            heroDescription: emptyToBlank(row.heroDescription),
            heroPrimaryCta: emptyToBlank(row.heroPrimaryCta),
            heroSecondaryCta: emptyToBlank(row.heroSecondaryCta),
            heroScrollHint: emptyToBlank(row.heroScrollHint),
            ctaTitle: emptyToBlank(row.ctaTitle),
            ctaDescription: emptyToBlank(row.ctaDescription),
            ctaButton: emptyToBlank(row.ctaButton),
            content,
          };
        },
      ),
    };
    return record;
  });
  return sortByCatalogOrder(
    records,
    (item) => item.key,
    processPagesCatalog.map((item) => item.key),
  );
}
