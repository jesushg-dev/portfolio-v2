import { render, screen } from "@testing-library/react";
import ProcessPageRoute from "./page";
import { api } from "@/trpc/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { notFound } from "next/navigation";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

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

jest.mock(
  "@/features/process-pages/components/process-page-view",
  () => ({
    ProcessPageView: ({ page }: { page: { heroTitle: string } }) => (
      <div data-testid="process-page-view">{page.heroTitle}</div>
    ),
  }),
);

describe("ProcessPageRoute", () => {
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

  it("calls notFound when page is missing", async () => {
    (api.processPages.getBySlug as jest.Mock).mockResolvedValue(null);

    await expect(
      ProcessPageRoute({
        params: Promise.resolve({ locale: "en", slug: "missing-page" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("renders JSON-LD structured data and ProcessPageView when page is found", async () => {
    const mockPage = {
      id: "page-1",
      slug: "how-i-use-ai",
      heroTitle: "How I Use AI",
      heroEyebrow: "Engineering Process",
      heroDescription: "How I leverage AI in development.",
      metaTitle: "How I Use AI · Process",
      metaDescription: "AI workflow in engineering",
      menuTitle: "How I Use AI",
      content: { sections: [] },
    };

    (api.processPages.getBySlug as jest.Mock).mockResolvedValue(mockPage);

    const jsx = await ProcessPageRoute({
      params: Promise.resolve({ locale: "en", slug: "how-i-use-ai" }),
    });

    const { container } = render(jsx);

    expect(screen.getByTestId("process-page-view")).toHaveTextContent(
      "How I Use AI",
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).toBeInTheDocument();

    const rawContent = script?.textContent ?? "{}";
    const parsedJsonLd = JSON.parse(rawContent) as {
      "@context"?: string;
      "@graph"?: {
        "@type": string;
        headline?: string;
        about?: string;
      }[];
    };
    expect(parsedJsonLd["@context"]).toBe("https://schema.org");
    expect(parsedJsonLd["@graph"]).toBeDefined();

    const graph = parsedJsonLd["@graph"] ?? [];
    const types = graph.map((node) => node["@type"]);
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("TechArticle");

    const articleNode = graph.find((node) => node["@type"] === "TechArticle");
    expect(articleNode?.headline).toBe("How I Use AI · Process");
    expect(articleNode?.about).toBe("Engineering Process");
  });
});
