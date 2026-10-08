import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { screen, fireEvent } from "@testing-library/react";

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
  } as unknown as Parameters<typeof PortfolioItem>[0];

  it("renders title, description and skills", () => {
    renderWithIntl(<PortfolioItem {...defaultProps} />);

    expect(screen.getByText("Awesome Project")).toBeInTheDocument();
    expect(
      screen.getByText("An awesome project description"),
    ).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows fallback when image fail event is triggered", () => {
    renderWithIntl(<PortfolioItem {...defaultProps} />);

    const img = screen.getByAltText("Awesome Project");
    fireEvent.error(img);

    expect(screen.queryByAltText("Awesome Project")).not.toBeInTheDocument();
    expect(screen.getByText("Awesome Project")).toBeInTheDocument();
    expect(
      document.querySelector('[data-mock="frontend"]'),
    ).toBeInTheDocument();
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
