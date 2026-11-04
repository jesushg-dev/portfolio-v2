import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { ProjectType } from "@/utils/interfaces/types";
import PortfolioGrid from "./portfolio-grid";

const projects: ProjectType[] = Array.from({ length: 9 }, (_, index) => ({
  id: `project-${index}`,
  title: `Project ${index + 1}`,
  description: `Summary ${index + 1}`,
  image: "https://example.com/project.webp",
  type: index < 7 ? "FRONTEND" : "BACKEND",
  skills: [
    {
      id: "s1",
      title: "React",
      image: "",
    } as unknown as ProjectType["skills"][0],
  ],
  highlights: [],
  kind: "PERSONAL",
  isPrivate: false,
  caseStudyEnabled: false,
  githubUrl: null,
  websiteUrl: null,
  order: index,
  slug: `project-${index}`,
  status: null,
  startedAt: null,
  endedAt: null,
  teamSize: null,
  csInfo: null,
}));

describe("PortfolioGrid", () => {
  it("renders showcase projects and CTA button", () => {
    renderWithIntl(
      <PortfolioGrid
        projects={projects.slice(0, 7)}
        totalCount={9}
        caseStudyCount={0}
      />,
    );

    // 7 showcase cards (1 hero + 6 grid cards)
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("Project 2")).toBeInTheDocument();
    expect(screen.getByText("Project 6")).toBeInTheDocument();
    expect(screen.getByText("Project 7")).toBeInTheDocument();
    expect(screen.queryByText("Project 8")).not.toBeInTheDocument();

    // CTA button to view all projects
    expect(screen.getByText(/View all projects/i)).toBeInTheDocument();
  });
});
