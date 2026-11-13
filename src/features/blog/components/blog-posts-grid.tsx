"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { cn } from "@/lib/utils";
import { BlogToolbar } from "./blog-toolbar";
import { BlogSeriesBanner } from "./blog-series-banner";
import { BlogFeaturedCard } from "./blog-featured-card";
import { BlogFeedItem } from "./blog-feed-item";
import { BlogGridItem } from "./blog-grid-item";
import type { SeriesOption } from "./blog-series-popover";
import type { TagCountItem } from "./blog-topics-popover";

export interface BlogPostSummary {
  id: string;
  slug: string;
  coverImage: string | null;
  tags: string[];
  seriesId: string | null;
  seriesSlug: string | null;
  seriesName: string | null;
  seriesOrder: number | null;
  publishedAt: string | null;
  title: string;
  excerpt: string;
  readingTime: number;
}

export interface SeriesItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  count: number;
  latestPublishedAt: string;
  sampleTitle: string;
}

export interface BlogPostsGridProps {
  locale: string;
  initialPosts: BlogPostSummary[];
  initialNextCursor: string | null;
  initialTotal?: number;
  initialTags?: string[];
  initialTag?: string;
  initialSeriesSlug?: string;
  initialSeriesName?: string;
  seriesList?: SeriesItem[];
}

export function BlogPostsGrid({
  locale,
  initialPosts,
  initialNextCursor,
  initialTotal,
  initialTag,
  initialSeriesSlug,
  initialSeriesName,
  seriesList,
}: BlogPostsGridProps) {
  const t = useTranslations("main.blog");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");
  const [activeTag, setActiveTag] = useState<string | null>(initialTag ?? null);
  const [activeSeries, setActiveSeries] = useState<string | null>(
    initialSeriesSlug ?? initialSeriesName ?? null,
  );
  const [sort, setSort] = useState<"new" | "old" | "part">(
    initialSeriesSlug || initialSeriesName ? "part" : "new",
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSeries = (series: string | null) => {
    setActiveSeries(series);
    if (series) {
      setSort("part");
    } else if (sort === "part") {
      setSort("new");
    }
  };

  const handleClearFilters = () => {
    setQuery("");
    setSearch("");
    setActiveTag(null);
    setActiveSeries(null);
    setSort("new");
  };

  const { data: dbSeriesList } = api.blog.getSeries.useQuery(
    { locale: locale as "en" | "es" | "nl" },
    seriesList ? { initialData: seriesList } : undefined,
  );

  const seriesOptions = useMemo<SeriesOption[]>(() => {
    const list = dbSeriesList ?? seriesList ?? [];
    return list.map((item) => ({
      slug: item.slug,
      name: item.name,
      description: item.description,
      count: item.count,
    }));
  }, [dbSeriesList, seriesList]);

  const selectedSeriesMeta = useMemo(() => {
    if (!activeSeries) return null;
    return (
      seriesOptions.find(
        (s) => s.slug === activeSeries || s.name === activeSeries,
      ) ?? null
    );
  }, [activeSeries, seriesOptions]);

  const activeSeriesDisplay = selectedSeriesMeta?.name ?? activeSeries;

  const { data: dbTagCounts } = api.blog.getTagCounts.useQuery({
    seriesSlug: selectedSeriesMeta?.slug ?? activeSeries ?? undefined,
  });

  const isInitialState =
    activeTag === (initialTag ?? null) &&
    !search &&
    activeSeries === (initialSeriesSlug ?? initialSeriesName ?? null) &&
    sort === (initialSeriesSlug || initialSeriesName ? "part" : "new");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    refetch,
  } = api.blog.list.useInfiniteQuery(
    {
      locale: locale as "en" | "es" | "nl",
      limit: 9,
      tag: activeTag ?? undefined,
      seriesSlug: selectedSeriesMeta?.slug ?? activeSeries ?? undefined,
      search: search || undefined,
      sort,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: isInitialState
        ? {
            pages: [
              {
                posts: initialPosts,
                nextCursor: initialNextCursor,
                total: initialTotal ?? initialPosts.length,
              },
            ],
            pageParams: [undefined],
          }
        : undefined,
    },
  );

  const posts = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.posts),
    [data],
  );

  const totalCount = data?.pages[0]?.total ?? 0;
  const remainingCount = Math.max(0, totalCount - posts.length);

  const tagsWithCounts = useMemo<TagCountItem[]>(() => {
    if (dbTagCounts && dbTagCounts.length > 0) {
      return dbTagCounts;
    }
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      p.tags.forEach((tag) => {
        if (!isSeriesTag(tag)) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) =>
        b.count !== a.count ? b.count - a.count : a.tag.localeCompare(b.tag),
      );
  }, [dbTagCounts, posts]);

  const isFiltering =
    Boolean(search.trim()) || Boolean(activeTag) || Boolean(activeSeries);

  const featured = useMemo(() => {
    if (isFiltering || posts.length === 0) return null;
    const standalone = posts.find((p) => !p.seriesName);
    if (standalone) return standalone;
    const chapterOne = posts.find((p) => p.seriesOrder === 1);
    if (chapterOne) return chapterOne;
    return posts[0] ?? null;
  }, [isFiltering, posts]);

  const articleList = useMemo(() => {
    if (!featured) return posts;
    return posts.filter((p) => p.id !== featured.id);
  }, [featured, posts]);

  const filterParts = useMemo(() => {
    const parts: string[] = [];
    if (activeSeriesDisplay) {
      parts.push(t("inSeries", { series: activeSeriesDisplay }));
    }
    if (activeTag) {
      parts.push(t("taggedWith", { tag: activeTag }));
    }
    if (search.trim()) {
      parts.push(t("matchingSearch", { query: search.trim() }));
    }
    return parts;
  }, [activeSeriesDisplay, activeTag, search, t]);

  const seriesPosts = useMemo(() => {
    if (!activeSeries) return [];
    return posts
      .filter(
        (p) =>
          p.seriesSlug === activeSeries || p.seriesName === activeSeriesDisplay,
      )
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
  }, [activeSeries, activeSeriesDisplay, posts]);

  const firstSeriesPost = seriesPosts[0];
  const activeSeriesCount = useMemo(() => {
    return selectedSeriesMeta ? selectedSeriesMeta.count : seriesPosts.length;
  }, [selectedSeriesMeta, seriesPosts.length]);

  return (
    <div className="w-full space-y-6">
      {/* 1. Sticky Toolbar */}
      <BlogToolbar
        query={query}
        onQueryChange={setQuery}
        activeSeries={activeSeriesDisplay}
        onSelectSeries={handleSelectSeries}
        seriesList={seriesOptions}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tagsWithCounts={tagsWithCounts}
        activeTag={activeTag}
        onSelectTag={setActiveTag}
        totalPostsCount={posts.length}
        locale={locale}
      />

      {/* 2. Active filter status row */}
      <div
        className={cn(
          "text-muted-foreground mt-4 flex min-h-7 flex-wrap",
          "items-center justify-between gap-2 px-1 text-sm",
        )}
      >
        <p aria-live="polite">
          <strong className="text-foreground font-semibold">
            {posts.length}
          </strong>{" "}
          {t("postsCount", { count: posts.length })}
          {filterParts.length > 0
            ? ` ${filterParts.join(` ${t("andSeparator")} `)}`
            : null}
        </p>
        {isFiltering ? (
          <button
            type="button"
            onClick={handleClearFilters}
            className={cn(
              "text-primary hover:bg-primary/10 rounded-lg px-2 py-1",
              "font-semibold transition-colors focus-visible:outline-2",
              "focus-visible:outline-primary",
            )}
          >
            {t("clearFilters")}
          </button>
        ) : null}
      </div>

      {/* 3. Series Banner (shown when a series is active) */}
      {activeSeriesDisplay ? (
        <BlogSeriesBanner
          activeSeries={activeSeriesDisplay}
          activeSeriesSlug={selectedSeriesMeta?.slug ?? activeSeries}
          seriesDescription={selectedSeriesMeta?.description}
          seriesPostsCount={activeSeriesCount}
          firstPostSlug={firstSeriesPost?.slug}
          firstPostOrder={firstSeriesPost?.seriesOrder}
          locale={locale}
        />
      ) : null}

      {/* 4. Article List / Grid / Empty / Error State */}
      <section aria-label={t("allArticles")} className="w-full">
        {isError ? (
          <div role="alert" className="space-y-3 py-12 text-center">
            <p className="text-muted-foreground">{t("loadError")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : isLoading ? (
          <p
            role="status"
            className="text-muted-foreground py-12 text-center text-sm"
          >
            {t("loading")}
          </p>
        ) : posts.length === 0 ? (
          <div
            className={cn(
              "border-border rounded-2xl border border-dashed",
              "px-6 py-16 text-center",
            )}
          >
            <p className="text-foreground text-lg font-bold">
              {t("emptyState.filteredTitle")}
            </p>
            <p className="text-muted-foreground mt-1">
              {t("emptyState.filteredDescription")}
            </p>
            <Button type="button" onClick={handleClearFilters} className="mt-5">
              {t("clearFilters")}
            </Button>
          </div>
        ) : viewMode === "feed" ? (
          <div className="w-full">
            {featured ? (
              <BlogFeaturedCard
                post={featured}
                locale={locale}
                onSelectTag={setActiveTag}
              />
            ) : null}

            {articleList.map((post) => (
              <BlogFeedItem
                key={post.id}
                post={post}
                locale={locale}
                onSelectSeries={handleSelectSeries}
                onSelectTag={setActiveTag}
              />
            ))}
          </div>
        ) : (
          <div className="w-full">
            {featured ? (
              <BlogFeaturedCard
                post={featured}
                locale={locale}
                onSelectTag={setActiveTag}
              />
            ) : null}

            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articleList.map((post) => (
                <BlogGridItem
                  key={post.id}
                  post={post}
                  locale={locale}
                  onSelectSeries={handleSelectSeries}
                  onSelectTag={setActiveTag}
                />
              ))}
            </div>
          </div>
        )}

        {/* Load more button */}
        {hasNextPage ? (
          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className={cn(
                "border-border/80 bg-card/60 text-foreground hover:bg-muted/40",
                "cursor-pointer rounded-full border px-8 py-3 text-sm font-medium",
                "shadow-xs transition-colors focus-visible:outline-2",
                "focus-visible:outline-primary disabled:cursor-not-allowed",
                "disabled:opacity-50",
              )}
            >
              {isFetchingNextPage
                ? t("loading")
                : remainingCount > 0
                  ? t("more", { count: remainingCount })
                  : t("loadMore")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
