import { fireEvent, render, screen } from "@testing-library/react";
import { BlogPostsGrid } from "./blog-posts-grid";

const mockPosts = [
  {
    id: "post-1",
    slug: "monitor-gaceta",
    coverImage: "/images/blog/gaceta.png",
    tags: ["nicaragua", "automation"],
    seriesId: null,
    seriesSlug: null,
    seriesName: null,
    seriesOrder: null,
    publishedAt: "2026-02-15T12:00:00.000Z",
    title: "Monitor de La Gaceta",
    excerpt: "Aprende a consultar el registro con JavaScript.",
    readingTime: 5,
  },
  {
    id: "post-2",
    slug: "portfolio-product",
    coverImage: null,
    tags: ["portfolio", "nextjs"],
    seriesId: "series-1",
    seriesSlug: "building-this-portfolio",
    seriesName: "Building this Portfolio",
    seriesOrder: 1,
    publishedAt: "2026-02-01T12:00:00.000Z",
    title: "Building this Portfolio Part 1",
    excerpt: "I started with a portfolio. I ended up with a product.",
    readingTime: 3,
  },
  {
    id: "post-3",
    slug: "portfolio-subdomain",
    coverImage: null,
    tags: ["portfolio", "multi-tenant"],
    seriesId: "series-1",
    seriesSlug: "building-this-portfolio",
    seriesName: "Building this Portfolio",
    seriesOrder: 2,
    publishedAt: "2026-02-03T12:00:00.000Z",
    title: "Building this Portfolio Part 2",
    excerpt: "Subdomains and multi-tenant setup.",
    readingTime: 4,
  },
];

const mockSeriesList = [
  {
    id: "series-1",
    slug: "building-this-portfolio",
    name: "Building this Portfolio",
    description: "Series description",
    coverImage: null,
    count: 2,
    latestPublishedAt: "2026-02-01T12:00:00.000Z",
    sampleTitle: "Building this Portfolio Part 1",
  },
];

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, values?: Record<string, string | number>) => {
      if (key === "postsCount" && values?.count !== undefined) {
        return `${String(values.count)} posts`;
      }
      if (key === "minRead" && values?.minutes !== undefined) {
        return `${String(values.minutes)} min read`;
      }
      if (key === "startWithPart" && values?.part !== undefined) {
        return `Start with part ${String(values.part)}`;
      }
      if (key === "inSeries" && values?.series !== undefined) {
        return `in ${String(values.series)}`;
      }
      if (key === "taggedWith" && values?.tag !== undefined) {
        return `tagged #${String(values.tag)}`;
      }
      if (key === "matchingSearch" && values?.query !== undefined) {
        return `matching "${String(values.query)}"`;
      }
      const map: Record<string, string> = {
        featured: "Featured",
        readArticle: "Read article",
        allSeries: "All series",
        sortNewest: "Newest first",
        sortOldest: "Oldest first",
        sortOrder: "Reading order",
        allTopics: "All topics",
        allTags: "All",
        viewFeed: "Feed",
        viewGrid: "Grid",
        series: "Series",
        seriesPage: "Series page",
        bestReadInOrder: "best read in order",
        clearFilters: "Clear filters",
        searchPlaceholder: "Search by title, topic, or tag...",
        filterPosts: "Filter posts",
        sortPosts: "Sort posts",
        layout: "Layout",
        andSeparator: "and",
        allArticles: "All articles",
        searchList: "Search list",
        noResults: "No results",
      };
      return map[key] ?? key;
    };
    return t;
  },
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: unknown;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    fill?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    blog: {
      getSeries: {
        useQuery: () => ({ data: mockSeriesList }),
      },
      getTagCounts: {
        useQuery: () => ({
          data: [
            { tag: "portfolio", count: 2 },
            { tag: "nicaragua", count: 1 },
            { tag: "automation", count: 1 },
            { tag: "nextjs", count: 1 },
          ],
        }),
      },
      list: {
        useInfiniteQuery: () => ({
          data: { pages: [{ posts: mockPosts, nextCursor: null }] },
          isLoading: false,
          isFetchingNextPage: false,
          fetchNextPage: jest.fn(),
          hasNextPage: false,
          isError: false,
          refetch: jest.fn(),
        }),
      },
    },
  },
}));

describe("BlogPostsGrid", () => {
  it("renders the sticky toolbar with search, series, sort, and views", () => {
    render(
      <BlogPostsGrid
        locale="en"
        initialPosts={mockPosts}
        initialNextCursor={null}
        seriesList={mockSeriesList}
      />,
    );

    expect(
      screen.getByPlaceholderText("Search by title, topic, or tag..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /all series/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grid" })).toBeInTheDocument();
  });

  it("focuses search input when pressing '/' shortcut key outside inputs", () => {
    render(
      <BlogPostsGrid
        locale="en"
        initialPosts={mockPosts}
        initialNextCursor={null}
        seriesList={mockSeriesList}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      "Search by title, topic, or tag...",
    );
    expect(searchInput).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "/" });
    expect(searchInput).toHaveFocus();
  });

  it("renders featured card when browsing without active filters", () => {
    render(
      <BlogPostsGrid
        locale="en"
        initialPosts={mockPosts}
        initialNextCursor={null}
        seriesList={mockSeriesList}
      />,
    );

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Monitor de La Gaceta")).toBeInTheDocument();
  });

  it("toggles between feed view and grid view", () => {
    render(
      <BlogPostsGrid
        locale="en"
        initialPosts={mockPosts}
        initialNextCursor={null}
        seriesList={mockSeriesList}
      />,
    );

    const gridBtn = screen.getByRole("button", { name: "Grid" });
    const feedBtn = screen.getByRole("button", { name: "Feed" });

    expect(feedBtn).toHaveAttribute("aria-pressed", "true");
    expect(gridBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(gridBtn);
    expect(gridBtn).toHaveAttribute("aria-pressed", "true");
    expect(feedBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows series banner when a series is active", () => {
    render(
      <BlogPostsGrid
        locale="en"
        initialPosts={mockPosts}
        initialNextCursor={null}
        initialSeriesName="Building this Portfolio"
        seriesList={mockSeriesList}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Building this Portfolio" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start with part 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Series page" }),
    ).toBeInTheDocument();
  });
});
