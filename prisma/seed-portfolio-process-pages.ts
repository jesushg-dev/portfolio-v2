import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

import {
  hydrateProcessPageContent,
  parseProcessPageContent,
  type ProcessPageContent,
  type ProcessPageIconName,
  type ProcessPageTemplateName,
} from "../src/features/process-pages/lib/process-page-content";

type LocaleCode = "en" | "es" | "nl";

const LOCALES: LocaleCode[] = ["en", "es", "nl"];

const WORKFLOW_BENEFIT_ICONS: ProcessPageIconName[] = [
  "Zap",
  "Layers",
  "Eye",
  "ShieldCheck",
  "Target",
  "CheckCircle",
];

const QA_BENEFIT_ICONS: ProcessPageIconName[] = [
  "ShieldCheck",
  "Handshake",
  "CheckCircle",
  "Target",
  "Eye",
  "Users",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numbered(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return Object.keys(record)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => record[key]);
}

function loadMessages(locale: LocaleCode): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      new URL(`../messages/${locale}.json`, import.meta.url),
      "utf8",
    ),
  ) as Record<string, unknown>;
}

function pathGet(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null) return undefined;
    return asRecord(current)[key];
  }, root);
}

function padStepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function mapWorkflowContent(page: Record<string, unknown>): ProcessPageContent {
  const nav = asRecord(page.nav);
  const hero = asRecord(page.hero);
  const workflow = asRecord(hero.workflow);
  const benefits = asRecord(page.benefits);
  const steps = asRecord(page.steps);
  const toolkit = asRecord(page.toolkit);
  const faq = asRecord(page.faq);

  return parseProcessPageContent(
    {
      kind: "WORKFLOW",
      navItems: [
        { id: "why", label: str(nav.why) },
        { id: "workflow", label: str(nav.workflow) },
        { id: "stack", label: str(nav.stack) },
        { id: "faq", label: str(nav.faq) },
      ],
      hero: {
        primaryHref: "#workflow",
        terminalTitle: str(pathGet(hero, "terminal.title")),
        workflow: {
          title: str(workflow.title),
          live: str(workflow.live),
          steps: numbered(workflow.steps).map((item) => str(item)),
        },
      },
      benefits: {
        eyebrow: str(benefits.eyebrow),
        title: str(benefits.title),
        items: numbered(benefits.items).map((item, index) => {
          const row = asRecord(item);
          return {
            icon: WORKFLOW_BENEFIT_ICONS[index] ?? "Zap",
            title: str(row.title),
            description: str(row.description),
          };
        }),
      },
      steps: {
        eyebrow: str(steps.eyebrow),
        title: str(steps.title),
        description: str(steps.description),
        inPracticeLabel: str(steps.inPractice),
        items: numbered(steps.items).map((item, index) => {
          const row = asRecord(item);
          return {
            number: padStepNumber(index),
            title: str(row.title),
            description: str(row.description),
            detail: str(row.detail),
            tools: str(row.tools),
          };
        }),
      },
      toolkit: {
        eyebrow: str(toolkit.eyebrow),
        title: str(toolkit.title),
        description: str(toolkit.description),
        footnote: str(toolkit.footnote),
        items: numbered(toolkit.items).map((item) => {
          const row = asRecord(item);
          return {
            id: str(row.id),
            name: str(row.name),
            initials: str(row.initials),
            description: str(row.description),
          };
        }),
      },
      faq: {
        eyebrow: str(faq.eyebrow),
        title: str(faq.title),
        items: numbered(faq.items).map((item) => {
          const row = asRecord(item);
          return {
            question: str(row.question),
            answer: str(row.answer),
          };
        }),
      },
    },
    "WORKFLOW",
  );
}

function mapQaContent(page: Record<string, unknown>): ProcessPageContent {
  const nav = asRecord(page.nav);
  const hero = asRecord(page.hero);
  const terminal = asRecord(hero.terminal);
  const benefits = asRecord(page.benefits);
  const steps = asRecord(page.steps);
  const roles = asRecord(page.roles);
  const faq = asRecord(page.faq);

  return parseProcessPageContent(
    {
      kind: "QA",
      navItems: [
        { id: "why", label: str(nav.why) },
        { id: "process", label: str(nav.process) },
        { id: "roles", label: str(nav.roles) },
        { id: "faq", label: str(nav.faq) },
      ],
      hero: {
        primaryHref: "#process",
        terminalTitle: str(terminal.title),
        testRunner: {
          cursorLabel: str(terminal.cursor),
          lines: [
            str(terminal.line1),
            str(terminal.line2),
            str(terminal.line3),
            str(terminal.line4),
            str(terminal.line5),
            str(terminal.line6),
            str(terminal.line7),
            str(terminal.line8),
            str(terminal.ready),
          ],
        },
      },
      benefits: {
        eyebrow: str(benefits.eyebrow),
        title: str(benefits.title),
        items: numbered(benefits.items).map((item, index) => {
          const row = asRecord(item);
          return {
            icon: QA_BENEFIT_ICONS[index] ?? "ShieldCheck",
            title: str(row.title),
            description: str(row.description),
          };
        }),
      },
      steps: {
        eyebrow: str(steps.eyebrow),
        title: str(steps.title),
        description: "",
        inPracticeLabel: "",
        items: numbered(steps.items).map((item, index) => {
          const row = asRecord(item);
          return {
            number: padStepNumber(index),
            title: str(row.title),
            description: str(row.description),
          };
        }),
      },
      roles: {
        eyebrow: str(roles.eyebrow),
        title: str(roles.title),
        description: str(roles.description),
        myRolesLabel: str(roles.myRolesLabel),
        myRoles: numbered(roles.myRoles).map((item) => str(item)),
        ecosystemRoles: numbered(roles.ecosystem).map((item) => str(item)),
        testingLabel: str(roles.testingLabel),
        testingTags: numbered(roles.testing).map((item) => str(item)),
      },
      faq: {
        eyebrow: str(faq.eyebrow),
        title: str(faq.title),
        items: numbered(faq.items).map((item) => {
          const row = asRecord(item);
          return {
            question: str(row.question),
            answer: str(row.answer),
          };
        }),
      },
    },
    "QA",
  );
}

function translationFields(
  page: Record<string, unknown>,
  menuTitle: string,
  navDescription: string,
) {
  const hero = asRecord(page.hero);
  const cta = asRecord(page.cta);
  const nav = asRecord(page.nav);
  return {
    metaTitle: str(page.metaTitle),
    metaDescription: str(page.metaDescription),
    menuTitle,
    navDescription,
    pageNavLabel: str(nav.label),
    heroEyebrow: str(hero.eyebrow),
    heroTitle: str(hero.title),
    heroTitleHighlight: str(hero.titleHighlight),
    heroDescription: str(hero.description),
    heroPrimaryCta: str(hero.primaryCta),
    heroSecondaryCta: str(hero.secondaryCta),
    heroScrollHint: str(hero.scrollHint),
    ctaTitle: str(cta.title),
    ctaDescription: str(cta.description),
    ctaButton: str(cta.button),
  };
}

interface SeedPageDef {
  slug: string;
  template: ProcessPageTemplateName;
  navIcon: ProcessPageIconName;
  order: number;
  messageKey: "howIUseAi" | "qaCollaboration";
  menuPath: string;
  navDescriptionPath: string;
  mapContent: (page: Record<string, unknown>) => ProcessPageContent;
}

const SEED_PAGES: SeedPageDef[] = [
  {
    slug: "how-i-use-ai",
    template: "WORKFLOW",
    navIcon: "Bot",
    order: 0,
    messageKey: "howIUseAi",
    menuPath: "global.footer.sections.process.howIUseAi",
    navDescriptionPath: "global.header.nav.items.ai-workflow.description",
    mapContent: mapWorkflowContent,
  },
  {
    slug: "qa-collaboration",
    template: "QA",
    navIcon: "HeartHandshake",
    order: 1,
    messageKey: "qaCollaboration",
    menuPath: "global.footer.sections.process.qaCollaboration",
    navDescriptionPath: "global.header.nav.items.qa-collaboration.description",
    mapContent: mapQaContent,
  },
];

export async function seedPortfolioProcessPages(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  console.log("[seed-portfolio-process-pages] seeding workflow + QA pages...");

  await prisma.processPage.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();
  const messagesByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, loadMessages(locale)]),
  ) as Record<LocaleCode, Record<string, unknown>>;

  for (const def of SEED_PAGES) {
    const translations = languages.map((language) => {
      const locale = (
        LOCALES.includes(language.code as LocaleCode) ? language.code : "en"
      ) as LocaleCode;
      const messages = messagesByLocale[locale] ?? messagesByLocale.en;
      const page = asRecord(pathGet(messages, `main.${def.messageKey}`));
      const fields = translationFields(
        page,
        str(pathGet(messages, def.menuPath)),
        str(pathGet(messages, def.navDescriptionPath)),
      );
      const content = hydrateProcessPageContent(def.mapContent(page), {
        pageNavLabel: fields.pageNavLabel,
        heroEyebrow: fields.heroEyebrow,
        heroTitle: fields.heroTitle,
        heroTitleHighlight: fields.heroTitleHighlight,
        heroDescription: fields.heroDescription,
        heroPrimaryCta: fields.heroPrimaryCta,
        heroSecondaryCta: fields.heroSecondaryCta,
        heroScrollHint: fields.heroScrollHint,
        ctaTitle: fields.ctaTitle,
        ctaDescription: fields.ctaDescription,
        ctaButton: fields.ctaButton,
      });
      return {
        appLanguageId: language.id,
        ...fields,
        content: content,
      };
    });

    await prisma.processPage.create({
      data: {
        userId,
        slug: def.slug,
        template: def.template,
        isPublished: true,
        showInNav: true,
        order: def.order,
        navIcon: def.navIcon,
        ProcessPageTranslation: {
          createMany: { data: translations },
        },
      },
    });
  }

  await backfillProcessPageNavDescriptions(prisma);
}

/** Fill empty `navDescription` on the two legacy slugs without wiping other CMS pages. */
export async function backfillProcessPageNavDescriptions(
  prisma: PrismaClient,
): Promise<void> {
  const languages = await prisma.appLanguage.findMany();
  const messagesByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, loadMessages(locale)]),
  ) as Record<LocaleCode, Record<string, unknown>>;

  const pages = await prisma.processPage.findMany({
    where: { slug: { in: SEED_PAGES.map((def) => def.slug) } },
    include: { ProcessPageTranslation: true },
  });

  for (const page of pages) {
    const def = SEED_PAGES.find((entry) => entry.slug === page.slug);
    if (!def) continue;

    for (const translation of page.ProcessPageTranslation) {
      if ((translation.navDescription ?? "").trim()) continue;
      const language = languages.find(
        (entry) => entry.id === translation.appLanguageId,
      );
      const locale = (
        language && LOCALES.includes(language.code as LocaleCode)
          ? language.code
          : "en"
      ) as LocaleCode;
      const messages = messagesByLocale[locale] ?? messagesByLocale.en;
      const navDescription = str(pathGet(messages, def.navDescriptionPath));
      if (!navDescription) continue;

      await prisma.processPageTranslation.update({
        where: { id: translation.id },
        data: { navDescription },
      });
    }
  }
}
