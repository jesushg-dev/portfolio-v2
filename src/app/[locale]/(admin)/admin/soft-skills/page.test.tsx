import { render, screen } from "@testing-library/react";

import SoftSkillsAdminPage from "./page";
import { getUserSoftSkillsWithLanguages } from "@/features/soft-skills/server/soft-skill-queries";

jest.mock("@/features/soft-skills/server/soft-skill-queries", () => ({
  getUserSoftSkillsWithLanguages: jest.fn(),
}));

jest.mock("@/features/soft-skills/components/soft-skills-list", () => ({
  SoftSkillsList: () => <div data-testid="soft-skills-list" />,
}));

describe("SoftSkillsAdminPage", () => {
  beforeEach(() => {
    (getUserSoftSkillsWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      languages: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await SoftSkillsAdminPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("soft-skills-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await SoftSkillsAdminPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserSoftSkillsWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
