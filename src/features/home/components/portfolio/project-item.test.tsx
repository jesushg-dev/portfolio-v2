import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import PortfolioItem from "./project-item";

interface MockLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  children?: ReactNode;
  href: string | { pathname?: string; params?: Record<string, string> };
}

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: MockLinkProps) => {
    const targetHref =
      typeof href === "string"
        ? href
        : Object.entries(href.params ?? {}).reduce(
            (path, [key, value]) => path.replace(`[${key}]`, value),
            href.pathname ?? "#",
          );
    return (
      <a href={targetHref} {...props}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("PortfolioItem", () => {
  const defaultProps = {
    id: "proj-1",
    title: "Awesome Project",
    image: "https://example.com/project.png",
    description: "An awesome project description",
    type: "Web",
    skills: [{ title: "React", image: "https://cdn.simpleicons.org/react" }],
    urlName: "View Website",
    sourceName: "View Source",
    canSeeDemo: "Can see demo",
    privateName: "Private",
    privateDescription: "Private repo",
    caseStudyLabel: "Case Study",
    kindLabels: { PROFESSIONAL: "Professional" },
    metaLabels: {
      solo: "Solo",
      team: "Team of 4",
      now: "present",
      statuses: {
        IN_PRODUCTION: "In production",
      },
    },
    teaserLabels: {
      decisions: "8 technical decisions",
      layers: "Architecture",
      metrics: "4 metrics",
    },
  } as unknown as Parameters<typeof PortfolioItem>[0];

  it("renders title, description, skills and meta line", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        teamSize={1}
        startedAt="2022-01-01"
        status="IN_PRODUCTION"
      />,
    );

    expect(screen.getByText("Awesome Project")).toBeInTheDocument();
    expect(
      screen.getByText("An awesome project description"),
    ).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(
      screen.getByText("Solo · 2022–present · In production"),
    ).toBeInTheDocument();
  });

  it("renders team size format when teamSize > 1", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        teamSize={4}
        startedAt="2022-01-01"
        status="IN_PRODUCTION"
      />,
    );

    expect(
      screen.getByText("Team of 4 · 2022–present · In production"),
    ).toBeInTheDocument();
  });

  it("renders highlights derived from the structured case-study summary", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        highlights={["45% faster", "100 users"]}
      />,
    );
    expect(screen.getByText("45% faster")).toBeInTheDocument();
    expect(screen.getByText("100 users")).toBeInTheDocument();
  });

  it("renders case study teaser when csInfo is present", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        caseStudyEnabled
        slug="awesome-project"
        csInfo={{ decisions: 8, layers: true, metrics: 4 }}
      />,
    );

    expect(
      screen.getByText("8 technical decisions · Architecture · 4 metrics"),
    ).toBeInTheDocument();
  });

  it("shows fallback when image fail event is triggered", async () => {
    renderWithIntl(<PortfolioItem {...defaultProps} />);

    const img = screen.getByAltText("Awesome Project");
    fireEvent.error(img);

    expect(screen.queryByAltText("Awesome Project")).not.toBeInTheDocument();
    expect(screen.getByText("Awesome Project")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        document.querySelector('[data-mock="frontend"]'),
      ).toBeInTheDocument();
    });
  });

  it("shows a modern case study button for enabled projects", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        slug="awesome-project"
        caseStudyEnabled
      />,
    );

    const caseStudyLink = screen.getByRole("link", {
      name: "Case Study: Awesome Project",
    });
    expect(caseStudyLink).toHaveAttribute("href", "/projects/awesome-project");
    expect(caseStudyLink).toHaveClass("text-primary");
  });

  it("does not show the case study button when it is disabled", () => {
    renderWithIntl(
      <PortfolioItem
        {...defaultProps}
        slug="awesome-project"
        caseStudyEnabled={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Case Study: Awesome Project" }),
    ).not.toBeInTheDocument();
  });
});
