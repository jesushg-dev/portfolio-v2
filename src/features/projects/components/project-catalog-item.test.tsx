import { screen, fireEvent } from "@testing-library/react";

import {
  ProjectCatalogItem,
  getProjectInitials,
  type ProjectCatalogItemData,
} from "./project-catalog-item";
import type { ProjectType } from "@/utils/interfaces/types";
import { renderWithIntl } from "@/test-utils/render-with-intl";

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; params?: Record<string, string> };
  }) => {
    let target = typeof href === "string" ? href : href.pathname;
    if (typeof href === "object" && href.params) {
      for (const [key, val] of Object.entries(href.params)) {
        target = target.replace(`[${key}]`, val);
      }
    }
    return (
      <a href={target} {...props}>
        {children}
      </a>
    );
  },
}));

const mockProject: ProjectType = {
  id: "proj-1",
  title: "Musa Ecommerce",
  type: "FRONTEND",
  kind: "PROFESSIONAL",
  description: "B2C agricultural commerce platform",
  image: "https://example.com/cover.jpg",
  caseStudyEnabled: true,
  slug: "musa-ecommerce",
  teamSize: 1,
  startedAt: "2024-01-01",
  skills: [
    {
      id: "s1",
      title: "React",
      image: "",
    } as unknown as ProjectType["skills"][0],
  ],
} as unknown as ProjectType;

describe("ProjectCatalogItem", () => {
  it("computes initials correctly", () => {
    expect(getProjectInitials("Musa Ecommerce")).toBe("ME");
    expect(getProjectInitials("OFILEGAL")).toBe("OF");
    expect(getProjectInitials("Store API: E-Commerce")).toBe("SA");
  });

  it("renders title, description, and meta text", () => {
    renderWithIntl(
      <ProjectCatalogItem
        project={mockProject}
        onPreview={jest.fn()}
        readCaseStudyLabel="Read case study"
        kindLabel="Client work"
        metaText="Client work · Solo · 2024"
      />,
    );

    expect(screen.getByText("Musa Ecommerce")).toBeInTheDocument();
    expect(
      screen.getByText("B2C agricultural commerce platform"),
    ).toBeInTheDocument();
    expect(screen.getByText("Client work · Solo · 2024")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("triggers onPreview when clicked or Enter pressed", () => {
    const handlePreview = jest.fn();
    renderWithIntl(
      <ProjectCatalogItem
        project={mockProject}
        onPreview={handlePreview}
        readCaseStudyLabel="Read case study"
        kindLabel="Client work"
      />,
    );

    const card = screen.getByRole("button", { name: /musa ecommerce/i });
    fireEvent.click(card);
    expect(handlePreview).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: "Enter" });
    expect(handlePreview).toHaveBeenCalledTimes(2);
  });

  it("renders case study link when case study is enabled", () => {
    renderWithIntl(
      <ProjectCatalogItem
        project={mockProject}
        onPreview={jest.fn()}
        readCaseStudyLabel="Read case study"
        kindLabel="Client work"
      />,
    );

    const csLink = screen.getByRole("link", { name: /read case study/i });
    expect(csLink).toBeInTheDocument();
    expect(csLink).toHaveAttribute("href", "/projects/musa-ecommerce");
  });

  it("renders initials placeholder when project has no image", () => {
    const projectNoImg: ProjectCatalogItemData = {
      ...mockProject,
      image: null,
      title: "OFILEGAL",
    };
    renderWithIntl(
      <ProjectCatalogItem
        project={projectNoImg}
        onPreview={jest.fn()}
        readCaseStudyLabel="Read case study"
        kindLabel="Client work"
      />,
    );

    expect(screen.getByText("OF")).toBeInTheDocument();
  });
});
