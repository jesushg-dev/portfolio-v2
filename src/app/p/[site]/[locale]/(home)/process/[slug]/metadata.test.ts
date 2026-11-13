import { generateMetadata } from "./metadata";
import { api } from "@/trpc/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_URL } from "@/lib/seo/site";

jest.mock("@/trpc/server", () => ({
  api: {
    processPages: {
      getBySlug: jest.fn(),
    },
  },
}));

jest.mock("@/lib/public-site/metadata", () => ({
  buildPublicAlternates: jest.fn(),
}));

jest.mock("@/lib/public-site/locale", () => ({
  getPublicLocale: jest.fn().mockResolvedValue("en"),
}));

describe("process/[slug] generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buildPublicAlternates as jest.Mock).mockResolvedValue({
      canonical: "https://jesushernandez.dev/process/how-i-use-ai",
      languages: {
        en: "https://jesushernandez.dev/process/how-i-use-ai",
        es: "https://jesushernandez.dev/es/proceso/how-i-use-ai",
        nl: "https://jesushernandez.dev/nl/proces/how-i-use-ai",
        "x-default": "https://jesushernandez.dev/process/how-i-use-ai",
      },
    });
  });

  it("returns empty metadata when process page is not found", async () => {
    (api.processPages.getBySlug as jest.Mock).mockResolvedValue(null);

    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "unknown-page" }),
    });

    expect(meta).toEqual({});
  });

  it("generates rich metadata with OpenGraph and alternates for how-i-use-ai", async () => {
    (api.processPages.getBySlug as jest.Mock).mockResolvedValue({
      slug: "how-i-use-ai",
      metaTitle: "How I Use AI · Process",
      metaDescription: "AI workflow in engineering",
      heroTitle: "How I Use AI",
      heroDescription: "AI engineering process description",
      menuTitle: "How I Use AI",
    });

    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "how-i-use-ai" }),
    });

    expect(meta.title).toBe("How I Use AI · Process");
    expect(meta.description).toBe("AI workflow in engineering");
    expect(meta.alternates?.canonical).toBe(
      "https://jesushernandez.dev/process/how-i-use-ai",
    );
    const og = meta.openGraph;
    const ogType = og && "type" in og ? og.type : undefined;
    expect(ogType).toBe("article");
    expect(meta.openGraph?.images).toEqual([
      {
        url: `${SITE_URL}/previews/process-how-i-use-ai.webp`,
        alt: "How I Use AI · Process",
      },
    ]);
  });
});
