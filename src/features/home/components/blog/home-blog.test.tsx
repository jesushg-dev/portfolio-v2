import { render, screen } from "@testing-library/react";
import { HomeBlogPost } from "./home-blog-post";

// Mock routing Link
jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
  } & Omit<React.ComponentPropsWithoutRef<"a">, "href">) => {
    let resolvedHref = typeof href === "string" ? href : href.pathname;
    if (typeof href !== "string" && href.params) {
      for (const [key, val] of Object.entries(href.params)) {
        resolvedHref = resolvedHref.replace(`[${key}]`, val);
      }
    }
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

describe("HomeBlogPost", () => {
  it("renders a featured post with the series, excerpt, and reading link", () => {
    const post = {
      id: "post-1",
      slug: "building-this-portfolio-overview",
      title: "Building this Portfolio: Overview",
      topic: "Building this Portfolio",
      partLabel: "Part 1/8",
      minReadLabel: "3 min read",
      excerpt: "An overview of how the portfolio was built.",
      coverImage: null,
      publishedAt: "2026-11-01T12:00:00.000Z",
      dateLabel: "Nov 2026",
    };

    render(<HomeBlogPost post={post} readPostLabel="Read post" />);

    expect(
      screen.getByText("Building this Portfolio: Overview"),
    ).toBeInTheDocument();
    expect(screen.getByText("Building this Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Part 1/8")).toBeInTheDocument();
    expect(screen.getByText("3 min read")).toBeInTheDocument();
    expect(screen.getByText("Nov 2026")).toHaveAttribute(
      "datetime",
      post.publishedAt,
    );
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
    expect(screen.getByText("Read post")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Building this Portfolio: Overview",
    });
    expect(link).toHaveAttribute(
      "href",
      "/blog/building-this-portfolio-overview",
    );
  });

  it("renders a recent entry with its topic and reading time", () => {
    const post = {
      id: "post-2",
      slug: "monitor-titulo-la-gaceta",
      title: "La Gaceta Title Monitor with JavaScript",
      topic: "automatizacion",
      minReadLabel: "12 min read",
      excerpt: "Build a monitor with JavaScript and Telegram.",
      coverImage: "/images/telegram.png",
      publishedAt: null,
    };

    render(<HomeBlogPost post={post} />);

    expect(
      screen.getByText("La Gaceta Title Monitor with JavaScript"),
    ).toBeInTheDocument();
    expect(screen.getByText("automatizacion")).toBeInTheDocument();
    expect(screen.getByText("12 min read")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      post.title,
    );
    expect(screen.queryByText("Read post")).not.toBeInTheDocument();
  });
});
