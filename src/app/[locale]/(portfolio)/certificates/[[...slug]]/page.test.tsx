import { render, screen } from "@testing-library/react";

import CertificatesPage, { generateMetadata } from "./page";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(async () => (key: string) => {
    const labels: Record<string, string> = {
      title: "Certificates",
      description: "Empowering projects",
    };
    return labels[key] ?? key;
  }),
  setRequestLocale: jest.fn(),
}));

jest.mock("@/components/certification/certification", () => ({
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

    const { container } = render(ui);
    const el = screen.getByTestId("certification");
    expect(el.getAttribute("data-slug")).toBe(JSON.stringify(["FRONTEND"]));
    expect(container).toBeTruthy();
  });

  it("passes undefined slug when no filter is selected", async () => {
    const ui = await CertificatesPage({
      params: Promise.resolve({ locale: "en", slug: undefined as never }),
    });

    render(ui);
    const el = screen.getByTestId("certification");
    expect(el.getAttribute("data-slug")).toBe("null");
  });
});

describe("generateMetadata", () => {
  it("returns certification namespace metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: undefined as never }),
    });

    expect(metadata.title).toBe("Certificates");
    expect(metadata.description).toBe("Empowering projects");
  });
});
