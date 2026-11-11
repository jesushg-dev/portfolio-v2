"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Hash,
  Layers,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { BlogEmptyState } from "@/features/blog/components/blog-empty-state";
import { cn } from "@/lib/utils";

interface BlogPostSummary {
  id: string;
  slug: string;
  coverImage: string | null;
  tags: string[];
  seriesName: string | null;
  seriesOrder: number | null;
  publishedAt: string | null;
  title: string;
  excerpt: string;
  readingTime: number;
}

interface BlogPostThumbnailProps {
  src: string | null;
  title: string;
  slug: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

function BlogPostThumbnail({
  src,
  title,
  slug,
  className,
  sizes = "(max-width: 48rem) 100vw, 20rem",
  priority = false,
}: BlogPostThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <Link
      href={{
        pathname: "/blog/[slug]",
        params: { slug },
      }}
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl border",
        "border-border/60 bg-muted/30 transition-all",
        "group-hover:border-primary/40 focus:outline-hidden",
        className,
      )}
    >
      {showFallback ? (
        <div className="from-primary/10 via-muted/40 to-background text-muted-foreground flex size-full min-h-24 items-center justify-center bg-gradient-to-br p-4 select-none">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <BookOpen className="text-primary/70 size-6" aria-hidden="true" />
            <span className="text-muted-foreground/80 font-mono text-[0.625rem] tracking-widest uppercase">
              Article
            </span>
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      )}
    </Link>
  );
}

interface SeriesItem {
  name: string;
  count: number;
}

interface BlogPostsGridProps {
  locale: string;
  initialPosts: BlogPostSummary[];
  initialNextCursor: string | null;
  initialTags?: string[];
  initialTag?: string;
  initialSeriesName?: string;
  seriesList?: SeriesItem[];
}

export function BlogPostsGrid({
  locale,
  initialPosts,
  initialNextCursor,
  initialTags,
  initialTag,
  initialSeriesName,
  seriesList,
}: BlogPostsGridProps) {
  const t = useTranslations("main.blog");
  const tabId = useId();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const [activeTag, setActiveTag] = useState<string | null>(initialTag ?? null);

  const { data: availableTags = initialTags ?? [] } = api.blog.getTags.useQuery(
    { seriesName: initialSeriesName },
    { initialData: initialTags },
  );

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
      seriesName: initialSeriesName,
      search: search || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData:
        !activeTag && !search
          ? {
              pages: [{ posts: initialPosts, nextCursor: initialNextCursor }],
              pageParams: [undefined],
            }
          : undefined,
    },
  );

  const posts = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.posts),
    [data],
  );

  const tags = useMemo(() => {
    const set = new Set(availableTags);
    if (activeTag) set.add(activeTag);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableTags, activeTag]);

  const isBrowsingAll = !activeTag && !search && !initialSeriesName;
  const featured = useMemo(() => {
    if (!isBrowsingAll || posts.length === 0) return null;
    const standalone = posts.find((p) => !p.seriesName);
    if (standalone) return standalone;
    const chapterOne = posts.find((p) => p.seriesOrder === 1);
    if (chapterOne) return chapterOne;
    return posts[0];
  }, [isBrowsingAll, posts]);

  const articleList = useMemo(() => {
    if (!isBrowsingAll || !featured) return posts;
    return posts.filter((p) => p.id !== featured.id);
  }, [isBrowsingAll, featured, posts]);
  const selectedTab = activeTag ? tags.indexOf(activeTag) + 1 : 0;

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    return new Date(isoDate).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-12">
      {/* Featured Story Spotlight (Only when on root blog view) */}
      {featured ? (
        <article className="b-card-glow border-border bg-card group hover:border-primary/40 relative overflow-hidden rounded-3xl border p-6 transition-all hover:shadow-xl md:p-8">
          <div className="grid gap-8 md:grid-cols-12 md:items-center">
            <div className="space-y-4 md:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold">
                  <Sparkles className="size-3" aria-hidden="true" />
                  <span>{t("featured")}</span>
                </span>

                {featured.seriesName ? (
                  <span className="border-border/60 bg-muted/60 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium">
                    <Layers
                      className="text-primary size-3"
                      aria-hidden="true"
                    />
                    <span className="max-w-[12rem] truncate">
                      {featured.seriesName}
                    </span>
                    {featured.seriesOrder ? (
                      <span>· #{featured.seriesOrder}</span>
                    ) : null}
                  </span>
                ) : null}

                {featured.publishedAt ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Calendar className="size-3" aria-hidden="true" />
                    <time dateTime={featured.publishedAt}>
                      {formatDate(featured.publishedAt)}
                    </time>
                  </span>
                ) : null}

                {featured.readingTime ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Clock className="size-3" aria-hidden="true" />
                    <span>
                      {t("minRead", { minutes: featured.readingTime })}
                    </span>
                  </span>
                ) : null}
              </div>

              <h2 className="text-foreground group-hover:text-primary text-2xl leading-snug font-bold tracking-tight transition-colors md:text-3xl lg:text-4xl">
                <Link
                  href={{
                    pathname: "/blog/[slug]",
                    params: { slug: featured.slug },
                  }}
                  className="focus:outline-hidden"
                >
                  {featured.title}
                </Link>
              </h2>

              {featured.excerpt ? (
                <p className="text-muted-foreground line-clamp-3 text-base leading-relaxed">
                  {featured.excerpt}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {featured.tags
                  .filter((tag) => !isSeriesTag(tag))
                  .slice(0, 4)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      #{tag}
                    </Badge>
                  ))}
              </div>

              <div className="pt-2">
                <Link
                  href={{
                    pathname: "/blog/[slug]",
                    params: { slug: featured.slug },
                  }}
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                >
                  <span>{t("readArticle")}</span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <BlogPostThumbnail
                src={featured.coverImage}
                title={featured.title}
                slug={featured.slug}
                priority
                sizes="(max-width: 48rem) 100vw, 40vw"
                className="aspect-video w-full rounded-2xl md:aspect-4/3"
              />
            </div>
          </div>
        </article>
      ) : null}

      {/* Learning Series Showcase Strip */}
      {seriesList && seriesList.length > 0 && isBrowsingAll ? (
        <section
          aria-labelledby="series-strip-title"
          className="border-border/60 bg-muted/20 rounded-3xl border p-6 md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                {t("series")}
              </p>
              <h2
                id="series-strip-title"
                className="text-foreground text-xl font-bold tracking-tight md:text-2xl"
              >
                {t("seriesStripTitle")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("seriesStripSubtitle")}
              </p>
            </div>
            <Link
              href={{ pathname: "/blog/series" }}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <span>{t("browseSeries")}</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {seriesList.slice(0, 2).map((item) => (
              <Link
                key={item.name}
                href={{
                  pathname: "/blog/series/[series]",
                  params: { series: item.name },
                }}
                className="border-border/80 bg-card hover:border-primary/40 group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="border-border/60 bg-muted flex size-8 items-center justify-center rounded-xl border">
                      <BookOpen
                        className="text-primary size-4"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="border-border/50 bg-muted/60 text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {t("postsCount", { count: item.count })}
                    </span>
                  </div>
                  <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-base font-bold tracking-tight transition-colors">
                    {item.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("viewSeries")}
                  </span>
                  <ArrowRight
                    className="text-primary size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Filter and View Controls Bar */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Tag Filter Pills */}
          {tags.length > 0 ? (
            <div className="overflow-x-auto pb-1 md:pb-0">
              <Tab
                tabId={tabId}
                ariaLabel={t("filterByTag")}
                currentTab={selectedTab}
                setCurrentTab={(index) =>
                  setActiveTag(index === 0 ? null : (tags[index - 1] ?? null))
                }
                className="max-w-full"
              >
                <TabItem
                  icon={LayoutGrid}
                  title={t("allTags")}
                  count={posts.length}
                />
                {tags.map((tag) => (
                  <TabItem key={tag} icon={Hash} title={tag} />
                ))}
              </Tab>
            </div>
          ) : (
            <div />
          )}

          {/* View mode toggle: Feed vs Grid */}
          <div className="border-border/70 bg-card/60 flex shrink-0 items-center self-end rounded-full border p-1 md:self-center">
            <button
              type="button"
              onClick={() => setViewMode("feed")}
              aria-label={t("viewFeed")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "feed"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" aria-hidden="true" />
              <span>{t("viewFeed")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label={t("viewGrid")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              <span>{t("viewGrid")}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mx-auto flex max-w-xl items-center">
          <label className="relative w-full">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              maxLength={200}
              className="border-input bg-card text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/20 h-11 w-full rounded-full border pr-10 pl-11 text-sm transition-all focus:ring-2 focus:outline-hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer p-1"
                aria-label={t("clearSearch")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>
        </div>

        {activeTag || search ? (
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {t("showingFiltered", { count: posts.length })}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveTag(null);
              }}
              className="text-primary inline-flex cursor-pointer items-center gap-1 font-medium hover:underline"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              <span>{t("clearFilters")}</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Main Articles Container */}
      <div
        role="tabpanel"
        id={`${tabId}-panel-${selectedTab}`}
        aria-labelledby={`${tabId}-tab-${selectedTab}`}
        aria-busy={isLoading}
      >
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
        ) : articleList.length === 0 ? (
          <BlogEmptyState
            isFiltered={Boolean(activeTag ?? search)}
            activeFilter={
              activeTag ? `#${activeTag}` : search ? `"${search}"` : undefined
            }
            onReset={() => {
              setQuery("");
              setActiveTag(null);
            }}
          />
        ) : viewMode === "feed" ? (
          /* Editorial Feed / Reading Stream View */
          <div className="divide-border/60 divide-y">
            {articleList.map((post) => (
              <article
                key={post.id}
                className="group py-8 transition-colors first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {post.seriesName ? (
                        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold">
                          <Layers className="size-3" aria-hidden="true" />
                          <span className="max-w-[14rem] truncate">
                            {post.seriesName}
                          </span>
                          {post.seriesOrder ? (
                            <span>· #{post.seriesOrder}</span>
                          ) : null}
                        </span>
                      ) : null}

                      {post.publishedAt ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Calendar className="size-3" aria-hidden="true" />
                          <time dateTime={post.publishedAt}>
                            {formatDate(post.publishedAt)}
                          </time>
                        </span>
                      ) : null}

                      {post.readingTime ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          <span>
                            {t("minRead", { minutes: post.readingTime })}
                          </span>
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-foreground group-hover:text-primary text-xl leading-snug font-bold tracking-tight transition-colors md:text-2xl">
                      <Link
                        href={{
                          pathname: "/blog/[slug]",
                          params: { slug: post.slug },
                        }}
                        className="focus:outline-hidden"
                      >
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed md:text-base">
                        {post.excerpt}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                        {post.tags
                          .filter((tag) => !isSeriesTag(tag))
                          .slice(0, 3)
                          .map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              #{tag}
                            </Badge>
                          ))}
                      </div>

                      <Link
                        href={{
                          pathname: "/blog/[slug]",
                          params: { slug: post.slug },
                        }}
                        className="text-primary hover:text-primary/80 ml-auto inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold transition-colors"
                      >
                        <span>{t("readArticle")}</span>
                        <ArrowRight
                          className="size-3.5 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>

                  <BlogPostThumbnail
                    src={post.coverImage}
                    title={post.title}
                    slug={post.slug}
                    sizes="(max-width: 48rem) 100vw, 14rem"
                    className="aspect-video w-full shrink-0 md:w-52"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid gap-6 md:grid-cols-2">
            {articleList.map((post, index) => (
              <article
                key={post.id}
                className="border-border bg-card group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 hover:border-primary/40 flex flex-col justify-between overflow-hidden rounded-2xl border transition-all hover:shadow-lg"
                style={{
                  animationDelay: `${Math.min(index * 60, 400)}ms`,
                }}
              >
                <BlogPostThumbnail
                  src={post.coverImage}
                  title={post.title}
                  slug={post.slug}
                  sizes="(max-width: 48rem) 100vw, 50vw"
                  className="border-border/60 aspect-video w-full rounded-none border-0 border-b"
                />

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-3">
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      {post.seriesName ? (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold">
                          {post.seriesName}
                          {post.seriesOrder ? ` #${post.seriesOrder}` : ""}
                        </span>
                      ) : null}

                      {post.publishedAt ? (
                        <time dateTime={post.publishedAt}>
                          {formatDate(post.publishedAt)}
                        </time>
                      ) : null}

                      {post.readingTime ? (
                        <span>
                          · {t("minRead", { minutes: post.readingTime })}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-lg leading-snug font-bold tracking-tight transition-colors">
                      <Link
                        href={{
                          pathname: "/blog/[slug]",
                          params: { slug: post.slug },
                        }}
                      >
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt ? (
                      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>

                  <div className="pt-6">
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {post.tags
                        .filter((tag) => !isSeriesTag(tag))
                        .slice(0, 3)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            #{tag}
                          </Badge>
                        ))}
                    </div>

                    <Link
                      href={{
                        pathname: "/blog/[slug]",
                        params: { slug: post.slug },
                      }}
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                      <span>{t("readArticle")}</span>
                      <ArrowRight
                        className="size-3.5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasNextPage ? (
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              onClick={() => {
                void fetchNextPage();
              }}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? t("loading") : t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
