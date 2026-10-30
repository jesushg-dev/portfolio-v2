import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { ProjectType } from "@/utils/interfaces/types";
import PortfolioGrid from "./portfolio-grid";

const projects: ProjectType[] = Array.from({ length: 9 }, (_, index) => ({
  id: `project-${index}`,
  title: `Project ${index + 1}`,
  description: `Summary ${index + 1}`,
  image: "https://example.com/project.webp",
  type: index < 7 ? "FRONTEND" : "BACKEND",
  skills: [],
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

it("filters the full server collection beyond the six initial cards without a query provider", async () => {
  renderWithIntl(
    <PortfolioGrid projects={projects} totalCount={9} caseStudyCount={0} />,
  );

  expect(screen.getAllByRole("article")).toHaveLength(6);
  expect(screen.queryByText("Project 8")).not.toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: /^Frontend \(7\)/ }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: /^Backend \(2\)/ }));

  const panel = screen.getByRole("tabpanel");
  expect(within(panel).getAllByRole("article")).toHaveLength(2);
  expect(within(panel).getByText("Project 8")).toBeInTheDocument();
  expect(within(panel).getByText("Project 9")).toBeInTheDocument();
  expect(within(panel).queryByText("Project 1")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: /^Mobile \(0\)/ }));
  await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  fireEvent.click(within(screen.getByRole("status")).getByRole("button"));
  expect(screen.getAllByRole("article")).toHaveLength(6);
});
