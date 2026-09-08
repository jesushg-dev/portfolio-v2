import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import PortfolioItem from "./project-item";

interface MockLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  children?: ReactNode;
  href: string | { pathname?: string };
}

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: MockLinkProps) => {
    const targetHref = typeof href === "string" ? href : (href.pathname ?? "#");
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
    expect(screen.getAllByText("Awesome Project")).toHaveLength(2);
  });
});
