import { z } from "zod";

import { PROCESS_PAGE_ICON_NAMES } from "@/lib/process-pages/process-page-icons";

export const PROCESS_PAGE_TEMPLATES = ["WORKFLOW", "QA"] as const;

export type ProcessPageTemplateName = (typeof PROCESS_PAGE_TEMPLATES)[number];

export const processPageTemplateSchema = z.enum(PROCESS_PAGE_TEMPLATES);

export {
  PROCESS_PAGE_ICON_NAMES,
  type ProcessPageIconName,
} from "@/lib/process-pages/process-page-icons";

export const processPageIconSchema = z.enum(PROCESS_PAGE_ICON_NAMES);

/**
 * First-path-segment collisions (current localized routes + common Next internals).
 * Canonical process slugs like `how-i-use-ai` are allowed.
 */
export const RESERVED_PROCESS_PAGE_SLUGS = [
  "admin",
  "agendar",
  "api",
  "about",
  "acerca",
  "beheer",
  "certificates",
  "certificados",
  "certificaten",
  "colofon",
  "colophon",
  "contact",
  "curriculum-vitae",
  "dashboard",
  "eleven-portfolio",
  "eleven-portafolio",
  "eleven-portefeuille",
  "estadisticas",
  "forgot-password",
  "habilidades",
  "home",
  "index",
  "iniciar-sesion",
  "inloggen",
  "linea-de-tiempo",
  "login",
  "now",
  "olvidar-contrasena",
  "over",
  "panel",
  "personalizar-tema",
  "plannen",
  "privacy",
  "privacidad",
  "proces",
  "process",
  "proceso",
  "projecten",
  "projects",
  "proyectos",
  "register",
  "registrarse",
  "registreren",
  "reset-password",
  "restablecer-contrasena",
  "schedule",
  "skills",
  "static",
  "statistieken",
  "stats",
  "thematool",
  "theme-customizer",
  "tijdlijn",
  "timeline",
  "trpc",
  "tweestapsverificatie",
  "two-factor",
  "uses",
  "vaardigheden",
  "verificacion-en-dos-pasos",
  "wachtwoord-herstellen",
  "wachtwoord-vergeten",
  "_next",
] as const;

export const reservedProcessPageSlugSet = new Set<string>(
  RESERVED_PROCESS_PAGE_SLUGS,
);

export const processPageSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase kebab-case (letters, numbers, hyphens).",
  )
  .refine((slug) => !reservedProcessPageSlugSet.has(slug), {
    message: "This slug is reserved.",
  });

export const PROCESS_PAGE_WIDGET_TYPES = [
  "nav",
  "hero",
  "benefits",
  "stepsAccordion",
  "stepsTimeline",
  "toolkit",
  "roles",
  "faq",
  "closingCta",
] as const;

export type ProcessPageWidgetType = (typeof PROCESS_PAGE_WIDGET_TYPES)[number];

export const processPageWidgetTypeSchema = z.enum(PROCESS_PAGE_WIDGET_TYPES);

export const DEFAULT_WIDGET_ANCHOR: Record<ProcessPageWidgetType, string> = {
  nav: "",
  hero: "hero",
  benefits: "why",
  stepsAccordion: "workflow",
  stepsTimeline: "process",
  toolkit: "stack",
  roles: "roles",
  faq: "faq",
  closingCta: "contact",
};

export const processNavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
});

export const processBenefitItemSchema = z.object({
  icon: processPageIconSchema,
  title: z.string(),
  description: z.string(),
});

export const processStepItemSchema = z.object({
  number: z.string(),
  title: z.string(),
  description: z.string(),
  detail: z.string().optional().default(""),
  tools: z.string().optional().default(""),
});

export const processFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const processToolItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  initials: z.string(),
  description: z.string(),
});

const widgetBaseSchema = z.object({
  id: z.string().min(1),
});

export const processHeroVisualSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("workflowCycle"),
    terminalTitle: z.string().default(""),
    title: z.string().default(""),
    live: z.string().default(""),
    steps: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal("testRunner"),
    terminalTitle: z.string().default(""),
    cursorLabel: z.string().default(""),
    lines: z.array(z.string()).default([]),
  }),
]);

export const processNavWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("nav"),
  label: z.string().default(""),
  items: z.array(processNavItemSchema).default([]),
});

export const processHeroWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("hero"),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  titleHighlight: z.string().default(""),
  description: z.string().default(""),
  primaryCta: z.string().default(""),
  primaryHref: z.string().default("#"),
  secondaryCta: z.string().default(""),
  secondaryHref: z.string().default("/schedule"),
  scrollHint: z.string().default(""),
  visual: processHeroVisualSchema.default({ kind: "none" }),
});

export const processBenefitsWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("benefits"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.benefits),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  items: z.array(processBenefitItemSchema).default([]),
});

export const processStepsAccordionWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("stepsAccordion"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.stepsAccordion),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  inPracticeLabel: z.string().default(""),
  items: z.array(processStepItemSchema).default([]),
});

export const processStepsTimelineWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("stepsTimeline"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.stepsTimeline),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  items: z.array(processStepItemSchema).default([]),
});

export const processToolkitWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("toolkit"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.toolkit),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  footnote: z.string().default(""),
  items: z.array(processToolItemSchema).default([]),
});

export const processRolesWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("roles"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.roles),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  myRolesLabel: z.string().default(""),
  myRoles: z.array(z.string()).default([]),
  ecosystemRoles: z.array(z.string()).default([]),
  testingLabel: z.string().default(""),
  testingTags: z.array(z.string()).default([]),
});

export const processFaqWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("faq"),
  anchorId: z.string().default(DEFAULT_WIDGET_ANCHOR.faq),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  items: z.array(processFaqItemSchema).default([]),
});

export const processClosingCtaWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("closingCta"),
  title: z.string().default(""),
  description: z.string().default(""),
  button: z.string().default(""),
});

export const processPageWidgetSchema = z.discriminatedUnion("type", [
  processNavWidgetSchema,
  processHeroWidgetSchema,
  processBenefitsWidgetSchema,
  processStepsAccordionWidgetSchema,
  processStepsTimelineWidgetSchema,
  processToolkitWidgetSchema,
  processRolesWidgetSchema,
  processFaqWidgetSchema,
  processClosingCtaWidgetSchema,
]);

export const processPageContentSchema = z.object({
  version: z.literal(2),
  sections: z.array(processPageWidgetSchema).default([]),
});

export type ProcessPageWidget = z.infer<typeof processPageWidgetSchema>;
export type ProcessPageContent = z.infer<typeof processPageContentSchema>;
export type ProcessHeroVisual = z.infer<typeof processHeroVisualSchema>;

const legacyWorkflowSchema = z.object({
  kind: z.literal("WORKFLOW"),
  navItems: z.array(processNavItemSchema).default([]),
  hero: z.object({
    primaryHref: z.string().default("#workflow"),
    terminalTitle: z.string().default(""),
    workflow: z.object({
      title: z.string().default(""),
      live: z.string().default(""),
      steps: z.array(z.string()).default([]),
    }),
  }),
  benefits: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    items: z.array(processBenefitItemSchema).default([]),
  }),
  steps: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    description: z.string().default(""),
    inPracticeLabel: z.string().default(""),
    items: z.array(processStepItemSchema).default([]),
  }),
  toolkit: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    description: z.string().default(""),
    footnote: z.string().default(""),
    items: z.array(processToolItemSchema).default([]),
  }),
  faq: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    items: z.array(processFaqItemSchema).default([]),
  }),
});

const legacyQaSchema = z.object({
  kind: z.literal("QA"),
  navItems: z.array(processNavItemSchema).default([]),
  hero: z.object({
    primaryHref: z.string().default("#process"),
    terminalTitle: z.string().default(""),
    testRunner: z.object({
      cursorLabel: z.string().default(""),
      lines: z.array(z.string()).default([]),
    }),
  }),
  benefits: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    items: z.array(processBenefitItemSchema).default([]),
  }),
  steps: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    description: z.string().default(""),
    inPracticeLabel: z.string().default(""),
    items: z.array(processStepItemSchema).default([]),
  }),
  roles: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    description: z.string().default(""),
    myRolesLabel: z.string().default(""),
    myRoles: z.array(z.string()).default([]),
    ecosystemRoles: z.array(z.string()).default([]),
    testingLabel: z.string().default(""),
    testingTags: z.array(z.string()).default([]),
  }),
  faq: z.object({
    eyebrow: z.string().default(""),
    title: z.string().default(""),
    items: z.array(processFaqItemSchema).default([]),
  }),
});

export function emptyProcessPageContent(): ProcessPageContent {
  return { version: 2, sections: [] };
}

export function createEmptyWidget(
  type: ProcessPageWidgetType,
  id = crypto.randomUUID(),
): ProcessPageWidget {
  switch (type) {
    case "nav":
      return { id, type, label: "", items: [] };
    case "hero":
      return {
        id,
        type,
        eyebrow: "",
        title: "",
        titleHighlight: "",
        description: "",
        primaryCta: "",
        primaryHref: "#",
        secondaryCta: "",
        secondaryHref: "/schedule",
        scrollHint: "",
        visual: { kind: "none" },
      };
    case "benefits":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.benefits,
        eyebrow: "",
        title: "",
        items: [],
      };
    case "stepsAccordion":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.stepsAccordion,
        eyebrow: "",
        title: "",
        description: "",
        inPracticeLabel: "",
        items: [],
      };
    case "stepsTimeline":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.stepsTimeline,
        eyebrow: "",
        title: "",
        description: "",
        items: [],
      };
    case "toolkit":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.toolkit,
        eyebrow: "",
        title: "",
        description: "",
        footnote: "",
        items: [],
      };
    case "roles":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.roles,
        eyebrow: "",
        title: "",
        description: "",
        myRolesLabel: "",
        myRoles: [],
        ecosystemRoles: [],
        testingLabel: "",
        testingTags: [],
      };
    case "faq":
      return {
        id,
        type,
        anchorId: DEFAULT_WIDGET_ANCHOR.faq,
        eyebrow: "",
        title: "",
        items: [],
      };
    case "closingCta":
      return { id, type, title: "", description: "", button: "" };
  }
}

function migrateLegacyWorkflow(
  value: z.infer<typeof legacyWorkflowSchema>,
): ProcessPageWidget[] {
  return [
    { id: "nav", type: "nav", label: "", items: value.navItems },
    {
      id: "hero",
      type: "hero",
      eyebrow: "",
      title: "",
      titleHighlight: "",
      description: "",
      primaryCta: "",
      primaryHref: value.hero.primaryHref,
      secondaryCta: "",
      secondaryHref: "/schedule",
      scrollHint: "",
      visual: {
        kind: "workflowCycle",
        terminalTitle: value.hero.terminalTitle,
        title: value.hero.workflow.title,
        live: value.hero.workflow.live,
        steps: value.hero.workflow.steps,
      },
    },
    {
      id: "benefits",
      type: "benefits",
      anchorId: DEFAULT_WIDGET_ANCHOR.benefits,
      eyebrow: value.benefits.eyebrow,
      title: value.benefits.title,
      items: value.benefits.items,
    },
    {
      id: "steps",
      type: "stepsAccordion",
      anchorId: DEFAULT_WIDGET_ANCHOR.stepsAccordion,
      eyebrow: value.steps.eyebrow,
      title: value.steps.title,
      description: value.steps.description,
      inPracticeLabel: value.steps.inPracticeLabel,
      items: value.steps.items,
    },
    {
      id: "toolkit",
      type: "toolkit",
      anchorId: DEFAULT_WIDGET_ANCHOR.toolkit,
      eyebrow: value.toolkit.eyebrow,
      title: value.toolkit.title,
      description: value.toolkit.description,
      footnote: value.toolkit.footnote,
      items: value.toolkit.items,
    },
    {
      id: "faq",
      type: "faq",
      anchorId: DEFAULT_WIDGET_ANCHOR.faq,
      eyebrow: value.faq.eyebrow,
      title: value.faq.title,
      items: value.faq.items,
    },
    { id: "cta", type: "closingCta", title: "", description: "", button: "" },
  ];
}

function migrateLegacyQa(
  value: z.infer<typeof legacyQaSchema>,
): ProcessPageWidget[] {
  return [
    { id: "nav", type: "nav", label: "", items: value.navItems },
    {
      id: "hero",
      type: "hero",
      eyebrow: "",
      title: "",
      titleHighlight: "",
      description: "",
      primaryCta: "",
      primaryHref: value.hero.primaryHref,
      secondaryCta: "",
      secondaryHref: "/schedule",
      scrollHint: "",
      visual: {
        kind: "testRunner",
        terminalTitle: value.hero.terminalTitle,
        cursorLabel: value.hero.testRunner.cursorLabel,
        lines: value.hero.testRunner.lines,
      },
    },
    {
      id: "benefits",
      type: "benefits",
      anchorId: DEFAULT_WIDGET_ANCHOR.benefits,
      eyebrow: value.benefits.eyebrow,
      title: value.benefits.title,
      items: value.benefits.items,
    },
    {
      id: "steps",
      type: "stepsTimeline",
      anchorId: DEFAULT_WIDGET_ANCHOR.stepsTimeline,
      eyebrow: value.steps.eyebrow,
      title: value.steps.title,
      description: value.steps.description,
      items: value.steps.items,
    },
    {
      id: "roles",
      type: "roles",
      anchorId: DEFAULT_WIDGET_ANCHOR.roles,
      eyebrow: value.roles.eyebrow,
      title: value.roles.title,
      description: value.roles.description,
      myRolesLabel: value.roles.myRolesLabel,
      myRoles: value.roles.myRoles,
      ecosystemRoles: value.roles.ecosystemRoles,
      testingLabel: value.roles.testingLabel,
      testingTags: value.roles.testingTags,
    },
    {
      id: "faq",
      type: "faq",
      anchorId: DEFAULT_WIDGET_ANCHOR.faq,
      eyebrow: value.faq.eyebrow,
      title: value.faq.title,
      items: value.faq.items,
    },
    { id: "cta", type: "closingCta", title: "", description: "", button: "" },
  ];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseProcessPageContent(
  value: unknown,
  template?: ProcessPageTemplateName,
): ProcessPageContent {
  const incoming = asRecord(value);
  if (incoming?.version === 2 || Array.isArray(incoming?.sections)) {
    const parsed = processPageContentSchema.safeParse({
      version: 2,
      sections: incoming.sections ?? [],
    });
    if (parsed.success) return parsed.data;
  }

  const kind =
    incoming?.kind === "QA" || incoming?.kind === "WORKFLOW"
      ? incoming.kind
      : template;

  if (kind === "QA") {
    const parsed = legacyQaSchema.safeParse({
      navItems: [],
      hero: {
        primaryHref: "#process",
        terminalTitle: "",
        testRunner: { cursorLabel: "", lines: [] },
      },
      benefits: { eyebrow: "", title: "", items: [] },
      steps: {
        eyebrow: "",
        title: "",
        description: "",
        inPracticeLabel: "",
        items: [],
      },
      roles: {
        eyebrow: "",
        title: "",
        description: "",
        myRolesLabel: "",
        myRoles: [],
        ecosystemRoles: [],
        testingLabel: "",
        testingTags: [],
      },
      faq: { eyebrow: "", title: "", items: [] },
      ...incoming,
      kind: "QA",
    });
    if (parsed.success) {
      return { version: 2, sections: migrateLegacyQa(parsed.data) };
    }
  }

  if (kind === "WORKFLOW") {
    const parsed = legacyWorkflowSchema.safeParse({
      navItems: [],
      hero: {
        primaryHref: "#workflow",
        terminalTitle: "",
        workflow: { title: "", live: "", steps: [] },
      },
      benefits: { eyebrow: "", title: "", items: [] },
      steps: {
        eyebrow: "",
        title: "",
        description: "",
        inPracticeLabel: "",
        items: [],
      },
      toolkit: {
        eyebrow: "",
        title: "",
        description: "",
        footnote: "",
        items: [],
      },
      faq: { eyebrow: "", title: "", items: [] },
      ...incoming,
      kind: "WORKFLOW",
    });
    if (parsed.success) {
      return { version: 2, sections: migrateLegacyWorkflow(parsed.data) };
    }
  }

  return emptyProcessPageContent();
}

export interface ProcessPageCopyFields {
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

export function hydrateProcessPageContent(
  content: ProcessPageContent,
  copy: ProcessPageCopyFields,
): ProcessPageContent {
  return {
    version: 2,
    sections: content.sections.map((section) => {
      if (section.type === "nav" && !section.label) {
        return { ...section, label: copy.pageNavLabel };
      }
      if (section.type === "hero" && !section.title && !section.eyebrow) {
        return {
          ...section,
          eyebrow: copy.heroEyebrow,
          title: copy.heroTitle,
          titleHighlight: copy.heroTitleHighlight,
          description: copy.heroDescription,
          primaryCta: copy.heroPrimaryCta,
          secondaryCta: copy.heroSecondaryCta,
          scrollHint: copy.heroScrollHint,
        };
      }
      if (section.type === "closingCta" && !section.title && !section.button) {
        return {
          ...section,
          title: copy.ctaTitle,
          description: copy.ctaDescription,
          button: copy.ctaButton,
        };
      }
      return section;
    }),
  };
}

export function flattenProcessPageCopy(
  content: ProcessPageContent,
): ProcessPageCopyFields {
  const nav = content.sections.find((section) => section.type === "nav");
  const hero = content.sections.find((section) => section.type === "hero");
  const cta = content.sections.find((section) => section.type === "closingCta");
  return {
    pageNavLabel: nav?.type === "nav" ? nav.label : "",
    heroEyebrow: hero?.type === "hero" ? hero.eyebrow : "",
    heroTitle: hero?.type === "hero" ? hero.title : "",
    heroTitleHighlight: hero?.type === "hero" ? hero.titleHighlight : "",
    heroDescription: hero?.type === "hero" ? hero.description : "",
    heroPrimaryCta: hero?.type === "hero" ? hero.primaryCta : "",
    heroSecondaryCta: hero?.type === "hero" ? hero.secondaryCta : "",
    heroScrollHint: hero?.type === "hero" ? hero.scrollHint : "",
    ctaTitle: cta?.type === "closingCta" ? cta.title : "",
    ctaDescription: cta?.type === "closingCta" ? cta.description : "",
    ctaButton: cta?.type === "closingCta" ? cta.button : "",
  };
}
