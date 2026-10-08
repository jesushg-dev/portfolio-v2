import type {
  ProcessPageTemplate,
  ProjectKind,
  ProjectStatus,
  SoftSkillsMediaType,
  StackType,
  TimelineCategory,
  UsesItemType,
} from "@prisma/client";

import certificationsJson from "../../../../../prisma/data/portfolio-certifications.json";
import nowJson from "../../../../../prisma/data/portfolio-now.json";
import processPagesJson from "../../../../../prisma/data/portfolio-process-pages.json";
import covid19 from "../../../../../prisma/data/projects/covid19.json";
import ecommerceAdmin from "../../../../../prisma/data/projects/ecommerce-admin.json";
import ecommerceApi from "../../../../../prisma/data/projects/ecommerce-api.json";
import ecommerce from "../../../../../prisma/data/projects/ecommerce.json";
import foodDelivery from "../../../../../prisma/data/projects/food-delivery.json";
import kwhMonitorApi from "../../../../../prisma/data/projects/kwh-monitor-api.json";
import kwhMonitor from "../../../../../prisma/data/projects/kwh-monitor.json";
import lottyApi from "../../../../../prisma/data/projects/lotty-api.json";
import lotty from "../../../../../prisma/data/projects/lotty.json";
import luckyApp from "../../../../../prisma/data/projects/lucky-app.json";
import musaAdmin from "../../../../../prisma/data/projects/musa-admin.json";
import musaEcommerce from "../../../../../prisma/data/projects/musa-ecommerce.json";
import portfolio from "../../../../../prisma/data/projects/portfolio.json";
import posInventory from "../../../../../prisma/data/projects/pos-inventory.json";
import requestAdmin from "../../../../../prisma/data/projects/request-admin.json";
import rickAndMorty from "../../../../../prisma/data/projects/rick-and-morty.json";
import softSkillsQuiz from "../../../../../prisma/data/projects/soft-skills-quiz.json";
import techServiceApi from "../../../../../prisma/data/projects/tech-service-api.json";
import techService from "../../../../../prisma/data/projects/tech-service.json";
import yourFarm from "../../../../../prisma/data/projects/your-farm.json";

const projectsJson = [
  portfolio,
  musaEcommerce,
  musaAdmin,
  ecommerceApi,
  ecommerce,
  ecommerceAdmin,
  foodDelivery,
  kwhMonitor,
  kwhMonitorApi,
  lotty,
  lottyApi,
  luckyApp,
  posInventory,
  requestAdmin,
  rickAndMorty,
  softSkillsQuiz,
  techService,
  techServiceApi,
  yourFarm,
  covid19,
].sort(
  (a, b) =>
    ((a as { order?: number }).order ?? 999) -
    ((b as { order?: number }).order ?? 999),
);
import servicesJson from "../../../../../prisma/data/portfolio-services.json";
import skillsJson from "../../../../../prisma/data/portfolio-skills.json";
import softSkillsJson from "../../../../../prisma/data/portfolio-soft-skills.json";
import timelineJson from "../../../../../prisma/data/portfolio-timeline.json";
import usesJson from "../../../../../prisma/data/portfolio-uses.json";

import type { ProcessPageContent } from "@/features/process-pages/lib/process-page-content";
import type { CaseStudyContentDTO } from "@/features/projects/lib/case-study";

import type { LocaleMap, SeedLocale } from "./locales";

export interface SkillSeedRecord {
  key: string;
  title: string;
  type: StackType;
  image: string;
  featured?: boolean;
  translations: {
    locale: SeedLocale;
    description: string;
    urlWiki: string;
  }[];
}

export interface ProjectSeedRecord {
  key: string;
  image: string;
  type: StackType;
  githubUrl: string;
  websiteUrl: string;
  isPrivate: boolean;
  order?: number;
  kind?: ProjectKind;
  slug?: string;
  caseStudyEnabled?: boolean;
  status?: ProjectStatus;
  startedAt?: string;
  endedAt?: string;
  teamSize?: number;
  translations: {
    locale: SeedLocale;
    title: string;
    description: string;
    hook?: string;
    challenge?: string;
    approach?: string;
    outcome?: string;
    caseStudy?: CaseStudyContentDTO;
  }[];
  skillKeys: string[];
}

export interface ServiceSeedRecord {
  key: string;
  type: StackType;
  icon?: string;
  statsValue?: string;
  featured?: boolean;
  isActive?: boolean;
  order?: number;
  image: string;
  translations: {
    locale: SeedLocale;
    title: string;
    description: string;
    badge?: string;
    statsLabel?: string;
  }[];
}

export interface CertificationSeedRecord {
  key: string;
  company: string;
  issuedDate: number | null;
  url: string;
  idCredential: string;
  image: string;
  type: StackType;
  skillKeys: string[];
  translations: {
    locale: SeedLocale;
    title: string;
  }[];
}

export interface TimelineItemSeedRecord {
  key: string;
  title: LocaleMap;
  description: LocaleMap;
  category: TimelineCategory;
  organization: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  images?: string[];
}

export interface SoftSkillsSeedRecord {
  section: {
    mediaType: SoftSkillsMediaType;
    videoUrl: string | null;
    posterUrl: string | null;
    imageUrl: string | null;
  };
  metrics?: {
    value: string;
    order: number;
    label: LocaleMap;
  }[];
  items: {
    icon: string;
    order: number;
    featured?: boolean;
    title: LocaleMap;
    description: LocaleMap;
    badge?: LocaleMap;
  }[];
}

export interface UsesSeedRecord {
  settings: {
    workspaceImage: string;
    codingPreviewLight: string;
    codingPreviewDark: string;
    codingIntro: LocaleMap;
    browserIntro: LocaleMap;
    clarifications: { order: number; body: LocaleMap }[];
    workspaceTags: { itemHref: string; xPercent: number; yPercent: number }[];
  };
  items: {
    type: UsesItemType;
    href: string;
    image: string | null;
    order: number;
    title: LocaleMap;
    description?: LocaleMap;
  }[];
}

export interface NowSeedRecord {
  settings: {
    timezone: string;
    githubUsername: string;
    statusEmoji: string;
    readingTitle: string;
    readingAuthors: string;
    readingProgress: number;
    watchedTitle: string;
    watchedRating: number;
    githubRepo: string;
    githubHref: string;
    photoUrls: string[];
    statusBody: LocaleMap;
    statusRelative: LocaleMap;
    githubBody: LocaleMap;
    githubRelative: LocaleMap;
  };
  focuses: {
    order: number;
    label: LocaleMap;
    body: LocaleMap;
  }[];
}

export interface ProcessPageSeedRecord {
  key: string;
  slug: string;
  template: ProcessPageTemplate;
  navIcon: string;
  order: number;
  isPublished: boolean;
  showInNav: boolean;
  translations: {
    locale: SeedLocale;
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
    content: ProcessPageContent;
  }[];
}

export const skillsCatalog = skillsJson as SkillSeedRecord[];
export const projectsCatalog = projectsJson as ProjectSeedRecord[];
export const servicesCatalog = servicesJson as ServiceSeedRecord[];
export const certificationsCatalog =
  certificationsJson as CertificationSeedRecord[];
export const timelineCatalog = timelineJson as {
  items: TimelineItemSeedRecord[];
};
export const softSkillsCatalog = softSkillsJson as SoftSkillsSeedRecord;
export const usesCatalog = usesJson as UsesSeedRecord;
export const nowCatalog = nowJson as NowSeedRecord;
export const processPagesCatalog = processPagesJson as ProcessPageSeedRecord[];
