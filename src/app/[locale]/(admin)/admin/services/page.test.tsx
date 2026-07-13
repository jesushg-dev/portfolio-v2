import { render, screen } from "@testing-library/react";

import ServicesPage from "./page";
import { getUserServicesWithLanguages } from "@/features/services/server/service-queries";

jest.mock("@/features/services/server/service-queries", () => ({
  getUserServicesWithLanguages: jest.fn(),
}));

jest.mock("@/features/services/components/services-list", () => ({
  ServicesList: () => <div data-testid="services-list" />,
}));

describe("ServicesPage", () => {
  beforeEach(() => {
    (getUserServicesWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      languages: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await ServicesPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("services-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await ServicesPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserServicesWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
