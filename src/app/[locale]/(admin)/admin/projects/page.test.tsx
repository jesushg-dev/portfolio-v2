import { render, screen } from "@testing-library/react";

import ProjectsPage from "./page";
import { getUserProjectsWithLanguages } from "@/features/projects/server/project-queries";

jest.mock("@/features/projects/server/project-queries", () => ({
  getUserProjectsWithLanguages: jest.fn(),
}));

jest.mock("@/features/projects/components/projects-list", () => ({
  ProjectsList: () => <div data-testid="projects-list" />,
}));

describe("ProjectsPage", () => {
  beforeEach(() => {
    (getUserProjectsWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      languages: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await ProjectsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("projects-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await ProjectsPage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserProjectsWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
