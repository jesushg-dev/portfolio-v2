import { render, screen } from "@testing-library/react";

import SkillsPage from "./page";
import { getUserSkillsWithLanguages } from "@/features/skills/server/skill-queries";

jest.mock("@/features/skills/server/skill-queries", () => ({
  getUserSkillsWithLanguages: jest.fn(),
}));

jest.mock("@/features/skills/components/skills-list", () => ({
  SkillsList: () => <div data-testid="skills-list" />,
}));

describe("SkillsPage", () => {
  beforeEach(() => {
    (getUserSkillsWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await SkillsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("skills-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await SkillsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserSkillsWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
