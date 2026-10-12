import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { PortfolioTopStack } from "./portfolio-top-stack";
import type { ProjectType } from "@/utils/interfaces/types";

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: { pathname: string; query?: { tech?: string } };
  }) => (
    <a href={`${href.pathname}?tech=${href.query?.tech ?? ""}`} {...props}>
      {children}
    </a>
  ),
}));

describe("PortfolioTopStack", () => {
  const mockProjects: ProjectType[] = [
    {
      id: "p1",
      title: "Project 1",
      skills: [
        {
          id: "s1",
          title: "React",
          image: "",
        } as unknown as ProjectType["skills"][0],
        {
          id: "s2",
          title: "TypeScript",
          image: "",
        } as unknown as ProjectType["skills"][0],
      ],
    } as unknown as ProjectType,
    {
      id: "p2",
      title: "Project 2",
      skills: [
        {
          id: "s1",
          title: "React",
          image: "",
        } as unknown as ProjectType["skills"][0],
        {
          id: "s3",
          title: "Tailwind CSS",
          image: "",
        } as unknown as ProjectType["skills"][0],
      ],
    } as unknown as ProjectType,
  ];

  it("renders top technologies and their counts", () => {
    renderWithIntl(
      <PortfolioTopStack
        projects={mockProjects}
        title="Most used stack"
        projectsWord="projects"
      />,
    );

    expect(screen.getByText("Most used stack")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // React appears in 2 projects
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Tailwind CSS")).toBeInTheDocument();
  });

  it("renders nothing when projects have no skills", () => {
    const { container } = renderWithIntl(
      <PortfolioTopStack
        projects={[]}
        title="Most used stack"
        projectsWord="projects"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
