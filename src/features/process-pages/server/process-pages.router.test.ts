import { emptyProcessPageContent } from "@/features/process-pages/lib/process-page-content";

import { getPublishedProcessPageBySlug } from "./process-pages-public";

const enLanguage = { id: "lang-en", code: "en" };
const esLanguage = { id: "lang-es", code: "es" };

function publishedPage(overrides?: { isPublished?: boolean; slug?: string }) {
  const content = emptyProcessPageContent();
  return {
    id: "page-1",
    slug: overrides?.slug ?? "how-i-use-ai",
    template: "WORKFLOW" as const,
    navIcon: "Bot",
    order: 0,
    showInNav: true,
    isPublished: overrides?.isPublished ?? true,
    ProcessPageTranslation: [
      {
        appLanguageId: enLanguage.id,
        metaTitle: "How I use AI",
        metaDescription: "desc",
        menuTitle: "How I use AI",
        navDescription: "AI tool integration and engineering workflow.",
        pageNavLabel: "On this page",
        heroEyebrow: "",
        heroTitle: "Title",
        heroTitleHighlight: "",
        heroDescription: "",
        heroPrimaryCta: "",
        heroSecondaryCta: "",
        heroScrollHint: "",
        ctaTitle: "",
        ctaDescription: "",
        ctaButton: "",
        content,
      },
    ],
  };
}

describe("getPublishedProcessPageBySlug", () => {
  it("returns null when there is no tenant", async () => {
    const findFirst = jest.fn();
    const findMany = jest.fn();
    const result = await getPublishedProcessPageBySlug(
      {
        appLanguage: { findMany },
        processPage: { findFirst },
      },
      null,
      "how-i-use-ai",
      "en",
    );

    expect(result).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns null for unpublished or missing pages (public 404)", async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const findMany = jest.fn().mockResolvedValue([enLanguage, esLanguage]);

    const result = await getPublishedProcessPageBySlug(
      {
        appLanguage: { findMany },
        processPage: { findFirst },
      },
      "user-1",
      "draft-page",
      "en",
    );

    expect(result).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          slug: "draft-page",
          isPublished: true,
        },
      }),
    );
  });

  it("returns mapped copy for a published slug", async () => {
    const page = publishedPage();
    const findFirst = jest.fn().mockResolvedValue(page);
    const findMany = jest.fn().mockResolvedValue([enLanguage, esLanguage]);

    const result = await getPublishedProcessPageBySlug(
      {
        appLanguage: { findMany },
        processPage: { findFirst },
      },
      "user-1",
      "how-i-use-ai",
      "en",
    );

    expect(result).not.toBeNull();
    expect(result?.slug).toBe("how-i-use-ai");
    expect(result?.heroTitle).toBe("Title");
    expect(result?.content.version).toBe(2);
    expect(Array.isArray(result?.content.sections)).toBe(true);
  });
});
