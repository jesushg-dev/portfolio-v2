import { emptyProcessPageContent } from "@/features/process-pages/lib/process-page-content";
import { buildProcessPageUpsertPayload } from "@/features/process-pages/lib/process-page-upsert-payload";
import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";

function formValues(
  overrides: Partial<ProcessPageFormValues> = {},
): ProcessPageFormValues {
  return {
    slug: "qa-collaboration",
    template: "QA",
    isPublished: true,
    showInNav: true,
    order: 1,
    navIcon: "Bot",
    translations: {},
    contentByLanguage: {
      "lang-en": emptyProcessPageContent(),
    },
    ...overrides,
  };
}

describe("buildProcessPageUpsertPayload", () => {
  it("preserves QA template instead of forcing WORKFLOW", () => {
    const payload = buildProcessPageUpsertPayload(formValues());
    expect(payload.template).toBe("QA");
    expect(payload.slug).toBe("qa-collaboration");
  });

  it("preserves WORKFLOW template when that is the form value", () => {
    const payload = buildProcessPageUpsertPayload(
      formValues({ slug: "how-i-use-ai", template: "WORKFLOW" }),
    );
    expect(payload.template).toBe("WORKFLOW");
  });

  it("forwards content including hero secondaryHref", () => {
    const content = emptyProcessPageContent();
    content.sections.push({
      id: "hero",
      type: "hero",
      eyebrow: "",
      title: "Title",
      titleHighlight: "",
      description: "",
      primaryCta: "Primary",
      primaryHref: "#workflow",
      secondaryCta: "Book",
      secondaryHref: "/custom-schedule",
      scrollHint: "",
      visual: { kind: "none" },
    });

    const payload = buildProcessPageUpsertPayload(
      formValues({
        contentByLanguage: { "lang-en": content },
      }),
    );

    const hero = payload.contentByLanguage["lang-en"]?.sections.find(
      (section) => section.type === "hero",
    );
    expect(hero?.type === "hero" && hero.secondaryHref).toBe(
      "/custom-schedule",
    );
  });
});
