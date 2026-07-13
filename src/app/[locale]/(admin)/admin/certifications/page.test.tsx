import { render, screen } from "@testing-library/react";

import CertificationsPage from "./page";
import { getUserCertificationsWithLanguages } from "@/features/certifications/server/certification-queries";

jest.mock("@/features/certifications/server/certification-queries", () => ({
  getUserCertificationsWithLanguages: jest.fn(),
}));

jest.mock("@/features/certifications/components/certifications-list", () => ({
  CertificationsList: () => <div data-testid="certifications-list" />,
}));

describe("CertificationsPage", () => {
  beforeEach(() => {
    (getUserCertificationsWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      languages: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await CertificationsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("certifications-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await CertificationsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserCertificationsWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
