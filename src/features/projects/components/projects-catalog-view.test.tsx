import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ProjectsCatalogView } from "./projects-catalog-view";
import type { ProjectType } from "@/utils/interfaces/types";

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname: string };
  }) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

describe("ProjectsCatalogView", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  const mockProjects: ProjectType[] = [
    {
      id: "p1",
      title: "Musa Ecommerce",
      type: "FRONTEND",
      kind: "PROFESSIONAL",
      description: "B2C ecommerce platform",
      image: "https://example.com/musa.jpg",
      caseStudyEnabled: true,
      slug: "musa-ecommerce",
      skills: [
        {
          id: "s1",
          title: "Next.js",
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
      title: "Tienda API",
      type: "BACKEND",
      kind: "PROFESSIONAL",
      description: "Clean Architecture API",
      image: "https://example.com/api.jpg",
      caseStudyEnabled: false,
      skills: [
        {
          id: "s3",
          title: "C#",
          image: "",
        } as unknown as ProjectType["skills"][0],
        {
          id: "s4",
          title: "SQL Server",
          image: "",
        } as unknown as ProjectType["skills"][0],
      ],
    } as unknown as ProjectType,
    {
      id: "p3",
      title: "Portfolio v2",
      type: "FRONTEND",
      kind: "PERSONAL",
      description: "Personal engineering portfolio",
      image: "https://example.com/portfolio.jpg",
      caseStudyEnabled: true,
      slug: "portfolio",
      skills: [
        {
          id: "s1",
          title: "Next.js",
          image: "",
        } as unknown as ProjectType["skills"][0],
        {
          id: "s5",
          title: "React",
          image: "",
        } as unknown as ProjectType["skills"][0],
      ],
    } as unknown as ProjectType,
  ];

  it("renders page title, search box, and all projects initially", () => {
    renderWithIntl(<ProjectsCatalogView initialProjects={mockProjects} />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByText("Musa Ecommerce")).toBeInTheDocument();
    expect(screen.getByText("Tienda API")).toBeInTheDocument();
    expect(screen.getByText("Portfolio v2")).toBeInTheDocument();
  });

  it("filters projects by search term", () => {
    renderWithIntl(<ProjectsCatalogView initialProjects={mockProjects} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "Tienda" } });

    expect(screen.getByText("Tienda API")).toBeInTheDocument();
    expect(screen.queryByText("Musa Ecommerce")).not.toBeInTheDocument();
    expect(screen.queryByText("Portfolio v2")).not.toBeInTheDocument();
  });

  it("filters projects by type when clicking segmented button", () => {
    renderWithIntl(<ProjectsCatalogView initialProjects={mockProjects} />);

    const backendBtn = screen.getByRole("button", { name: /backend/i });
    fireEvent.click(backendBtn);

    expect(screen.getByText("Tienda API")).toBeInTheDocument();
    expect(screen.queryByText("Musa Ecommerce")).not.toBeInTheDocument();
  });

  it("filters projects by case study toggle", () => {
    renderWithIntl(<ProjectsCatalogView initialProjects={mockProjects} />);

    const csSwitch = screen.getByRole("switch");
    fireEvent.click(csSwitch);

    // Tienda API has caseStudyEnabled: false, so it should disappear
    expect(screen.queryByText("Tienda API")).not.toBeInTheDocument();
    expect(screen.getByText("Musa Ecommerce")).toBeInTheDocument();
    expect(screen.getByText("Portfolio v2")).toBeInTheDocument();
  });

  it("shows empty state when no projects match filters and allows clearing", () => {
    renderWithIntl(<ProjectsCatalogView initialProjects={mockProjects} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "nonexistent query" } });

    expect(screen.queryByText("Musa Ecommerce")).not.toBeInTheDocument();

    const clearBtns = screen.getAllByRole("button", {
      name: /clear filters|limpiar filtros|filters wissen/i,
    });
    fireEvent.click(clearBtns[0]);

    expect(screen.getByText("Musa Ecommerce")).toBeInTheDocument();
    expect(screen.getByText("Tienda API")).toBeInTheDocument();
  });
});
