import { render, screen } from "@testing-library/react";
import { CompactBlogCard } from "./compact-blog-card";

// Mock routing Link
jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; params?: Record<string, string> };
    className?: string;
  }) => {
    let resolvedHref = typeof href === "string" ? href : href.pathname;
    if (typeof href !== "string" && href.params) {
      for (const [key, val] of Object.entries(href.params)) {
        resolvedHref = resolvedHref.replace(`[${key}]`, val);
      }
    }
    return (
      <a href={resolvedHref} className={className}>
        {children}
      </a>
    );
  },
}));

describe("CompactBlogCard", () => {
  it("renders post with series badge, reading time, and link", () => {
    const post = {
      id: "post-1",
      slug: "building-this-portfolio-overview",
      title: "Building this Portfolio: Overview",
      readingTime: 3,
      seriesName: "Building this Portfolio",
      seriesOrder: 1,
      tags: ["portfolio", "nextjs"],
      coverImage: null,
    };

    render(
      <CompactBlogCard
        post={post}
        seriesTotal={8}
        partLabel="Part 1/8"
        minReadLabel="3 min read"
      />,
    );

    expect(
      screen.getByText("Building this Portfolio: Overview"),
    ).toBeInTheDocument();
    expect(screen.getByText("Building this Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Part 1/8")).toBeInTheDocument();
    expect(screen.getByText("3 min read")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Building this Portfolio: Overview",
    });
    expect(link).toHaveAttribute(
      "href",
      "/blog/building-this-portfolio-overview",
    );
  });

  it("renders standalone post with tag badge when not part of a series", () => {
    const post = {
      id: "post-2",
      slug: "monitor-titulo-la-gaceta",
      title: "La Gaceta Title Monitor with JavaScript",
      readingTime: 12,
      seriesName: null,
      seriesOrder: null,
      tags: ["automatizacion", "telegram"],
      coverImage: "/images/telegram.png",
    };

    render(
      <CompactBlogCard post={post} partLabel="" minReadLabel="12 min read" />,
    );

    expect(
      screen.getByText("La Gaceta Title Monitor with JavaScript"),
    ).toBeInTheDocument();
    expect(screen.getByText("#automatizacion")).toBeInTheDocument();
    expect(screen.getByText("12 min read")).toBeInTheDocument();
  });
});
