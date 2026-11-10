import { render, screen } from "@testing-library/react";

import CertificatesPage, { generateMetadata } from "./page";

jest.mock("next-intl/server", () => {
  const createMockTranslator = () => {
    const labels: Record<string, string> = {
      title: "Certificates",
      description: "Empowering projects",
    };
    const t = (key: string) => labels[key] ?? key;
    t.has = (key: string) => key in labels;
    t.raw = (key: string) => labels[key] ?? key;
    t.rich = (key: string) => labels[key] ?? key;
    t.markup = (key: string) => labels[key] ?? key;
    return t;
  };

  return {
    getTranslations: jest.fn(() => Promise.resolve(createMockTranslator())),
  };
});

jest.mock("@/features/certifications/components/certification", () => ({
  __esModule: true,
  default: ({ slug }: { slug?: string[] }) => (
    <div data-testid="certification" data-slug={JSON.stringify(slug ?? null)} />
  ),
}));

describe("CertificatesPage", () => {
  it("passes slug to Certification component", async () => {
    const ui = await CertificatesPage({
      params: Promise.resolve({ locale: "en", slug: ["FRONTEND"] }),
    });
    render(ui);

    const el = screen.getByTestId("certification");
    expect(el).toHaveAttribute("data-slug", JSON.stringify(["FRONTEND"]));
  });

  it("renders when slug is omitted", async () => {
    const ui = await CertificatesPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(ui);

    const el = screen.getByTestId("certification");
    expect(el).toHaveAttribute("data-slug", JSON.stringify(null));
  });

  it("produces translated metadata for canonical certificates index", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(meta.title).toBe("Certificates");
    expect(meta.description).toBe("Empowering projects");
  });
});
