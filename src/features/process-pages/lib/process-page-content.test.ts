import {
  processPageSlugSchema,
  parseProcessPageContent,
  processHeroWidgetSchema,
  createEmptyWidget,
  PROCESS_PAGE_WIDGET_TYPES,
  flattenProcessPageCopy,
  hydrateProcessPageContent,
  emptyProcessPageContent,
} from "./process-page-content";

describe("processPageSlugSchema", () => {
  it("accepts canonical process slugs", () => {
    expect(processPageSlugSchema.parse("how-i-use-ai")).toBe("how-i-use-ai");
    expect(processPageSlugSchema.parse("qa-collaboration")).toBe(
      "qa-collaboration",
    );
  });

  it("normalizes trim and case", () => {
    expect(processPageSlugSchema.parse("  My-Page  ")).toBe("my-page");
  });

  it.each([
    "admin",
    "login",
    "schedule",
    "uses",
    "now",
    "stats",
    "estadisticas",
    "statistieken",
    "process",
    "proceso",
    "proces",
    "projects",
    "skills",
    "api",
  ])("rejects reserved slug %s", (slug) => {
    const result = processPageSlugSchema.safeParse(slug);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "This slug is reserved.",
        ),
      ).toBe(true);
    }
  });

  it("rejects non kebab-case values", () => {
    expect(processPageSlugSchema.safeParse("Has Spaces").success).toBe(false);
    expect(processPageSlugSchema.safeParse("under_score").success).toBe(false);
    expect(processPageSlugSchema.safeParse("").success).toBe(false);
  });
});

describe("parseProcessPageContent", () => {
  it("keeps widget sections", () => {
    const parsed = parseProcessPageContent({
      version: 2,
      sections: [
        {
          id: "hero",
          type: "hero",
          title: "Hello",
          visual: { kind: "none" },
        },
        { id: "faq", type: "faq", title: "FAQ", items: [] },
      ],
    });
    expect(parsed.version).toBe(2);
    expect(parsed.sections.map((section) => section.type)).toEqual([
      "hero",
      "faq",
    ]);
  });

  it("migrates legacy WORKFLOW JSON into widgets", () => {
    const parsed = parseProcessPageContent(
      {
        kind: "WORKFLOW",
        navItems: [{ id: "why", label: "Why" }],
        hero: {
          primaryHref: "#workflow",
          terminalTitle: "term",
          workflow: { title: "Cycle", live: "Live", steps: ["A", "B"] },
        },
        benefits: { eyebrow: "Why", title: "Benefits", items: [] },
        steps: {
          eyebrow: "",
          title: "Steps",
          description: "",
          inPracticeLabel: "In practice",
          items: [],
        },
        toolkit: {
          eyebrow: "",
          title: "Tools",
          description: "",
          footnote: "",
          items: [],
        },
        faq: { eyebrow: "", title: "FAQ", items: [] },
      },
      "WORKFLOW",
    );
    expect(parsed.sections.map((section) => section.type)).toEqual([
      "nav",
      "hero",
      "benefits",
      "stepsAccordion",
      "toolkit",
      "faq",
      "closingCta",
    ]);
    const hero = parsed.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" && hero.visual.kind).toBe("workflowCycle");
  });

  it("migrates legacy QA JSON into widgets", () => {
    const parsed = parseProcessPageContent({ kind: "QA" }, "QA");
    expect(parsed.sections.map((section) => section.type)).toEqual([
      "nav",
      "hero",
      "benefits",
      "stepsTimeline",
      "roles",
      "faq",
      "closingCta",
    ]);
  });
});

describe("hero secondaryHref", () => {
  it("defaults secondaryHref to /schedule when omitted", () => {
    const hero = processHeroWidgetSchema.parse({
      id: "hero",
      type: "hero",
      title: "Hello",
    });
    expect(hero.secondaryHref).toBe("/schedule");
  });

  it("keeps an editable secondaryHref value", () => {
    const hero = processHeroWidgetSchema.parse({
      id: "hero",
      type: "hero",
      secondaryHref: "/book-a-call",
    });
    expect(hero.secondaryHref).toBe("/book-a-call");
  });

  it("includes /schedule secondaryHref on empty hero widgets", () => {
    const hero = createEmptyWidget("hero");
    expect(hero.type).toBe("hero");
    if (hero.type === "hero") {
      expect(hero.secondaryHref).toBe("/schedule");
    }
  });

  it("builds an empty widget for every type", () => {
    for (const type of PROCESS_PAGE_WIDGET_TYPES) {
      const widget = createEmptyWidget(type, `id-${type}`);
      expect(widget.type).toBe(type);
      expect(widget.id).toBe(`id-${type}`);
    }
  });

  it("hydrates and flattens copy from hero, nav, and CTA widgets", () => {
    const content = emptyProcessPageContent();
    content.sections.push(
      createEmptyWidget("nav", "nav"),
      createEmptyWidget("hero", "hero"),
      createEmptyWidget("closingCta", "cta"),
    );
    const hydrated = hydrateProcessPageContent(content, {
      pageNavLabel: "On this page",
      heroEyebrow: "Process",
      heroTitle: "How I work",
      heroTitleHighlight: "AI",
      heroDescription: "Details",
      heroPrimaryCta: "Start",
      heroSecondaryCta: "Book",
      heroScrollHint: "Scroll",
      ctaTitle: "Let's talk",
      ctaDescription: "Schedule",
      ctaButton: "Book",
    });
    const copy = flattenProcessPageCopy(hydrated);
    expect(copy.pageNavLabel).toBe("On this page");
    expect(copy.heroTitle).toBe("How I work");
    expect(copy.ctaButton).toBe("Book");
  });

  it("defaults secondaryHref when parsing stored v2 content without it", () => {
    const parsed = parseProcessPageContent({
      version: 2,
      sections: [
        {
          id: "hero",
          type: "hero",
          title: "Hello",
          secondaryCta: "Schedule",
          visual: { kind: "none" },
        },
      ],
    });
    const hero = parsed.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" && hero.secondaryHref).toBe("/schedule");
    expect(hero?.type === "hero" && hero.secondaryCta).toBe("Schedule");
  });
});
