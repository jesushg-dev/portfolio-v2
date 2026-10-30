"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Hash, LayoutGrid } from "lucide-react";

import { Link } from "@/i18n/routing";
import { buildCloudinaryUrl } from "@/utils/tools/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";

interface BlogPostsGridProps {
  locale: string;
  initialTag?: string;
  initialSeriesName?: string;
  labels: {
    empty: string;
    readMore: string;
    featured: string;
    searchPlaceholder: string;
    filterByTag: string;
    clearFilters: string;
    loadMore: string;
    loading: string;
  };
}

export function BlogPostsGrid({
  locale,
  labels,
  initialTag,
  initialSeriesName,
}: BlogPostsGridProps) {
  const t = useTranslations("main.blog");
  const tabId = useId();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag ?? null);
  const { data: availableTags = [] } = api.blog.getTags.useQuery({
    seriesName: initialSeriesName,
  });
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

  const featured = posts[0];
  const rest = posts.slice(1);
  const selectedTab = activeTag ? tags.indexOf(activeTag) + 1 : 0;

  return (
    <div className="space-y-8">
      <div className="bg-card border-border rounded-2xl border p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            maxLength={200}
            className="h-11"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {labels.filterByTag}
            </span>
            <Tab
              minimal
              tabId={tabId}
              ariaLabel={labels.filterByTag}
              currentTab={selectedTab}
              setCurrentTab={(index) =>
                setActiveTag(index === 0 ? null : (tags[index - 1] ?? null))
              }
              className="w-full min-w-0"
            >
              <TabItem icon={LayoutGrid} title={t("allTags")} description="" />
              {tags.map((tag) => (
                <TabItem key={tag} icon={Hash} title={tag} description="" />
              ))}
            </Tab>
            {(query || activeTag) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag(null);
                }}
                className="text-primary min-h-11 text-sm font-medium"
              >
                {labels.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${tabId}-panel-${selectedTab}`}
        aria-labelledby={`${tabId}-tab-${selectedTab}`}
        aria-busy={isLoading}
      >
        {isError ? (
          <div role="alert" className="space-y-3 text-center">
            <p>{t("loadError")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : isLoading ? (
          <p role="status" className="text-muted-foreground text-center">
            {labels.loading}
          </p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center">{labels.empty}</p>
        ) : (
          <div className="space-y-8">
            {featured ? (
              <Link
                href={{
                  pathname: "/blog/[slug]",
                  params: { slug: featured.slug },
                }}
                className="border-border bg-card group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 block overflow-hidden rounded-2xl border transition-shadow hover:shadow-xl"
              >
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-video md:aspect-auto md:min-h-70">
                    {featured.coverImage ? (
                      <Image
                        src={buildCloudinaryUrl(featured.coverImage, 1200)}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 48rem) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="bg-muted h-full w-full" />
                    )}
                  </div>
                  <div className="p-6 md:p-8">
                    <p className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
                      {labels.featured}
                    </p>
                    <h2 className="text-foreground mb-3 text-2xl leading-tight font-bold md:text-3xl">
                      {featured.title}
                    </h2>
                    {featured.excerpt ? (
                      <p className="text-muted-foreground mb-5 line-clamp-3">
                        {featured.excerpt}
                      </p>
                    ) : null}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {featured.tags
                        .filter((tag) => !isSeriesTag(tag))
                        .map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                    {featured.publishedAt ? (
                      <time
                        dateTime={featured.publishedAt}
                        className="text-muted-foreground text-sm"
                      >
                        {new Date(featured.publishedAt).toLocaleDateString(
                          locale,
                        )}
                      </time>
                    ) : null}
                  </div>
                </div>
              </Link>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, index) => (
                <Link
                  key={post.id}
                  href={{
                    pathname: "/blog/[slug]",
                    params: { slug: post.slug },
                  }}
                  className="border-border bg-card group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 overflow-hidden rounded-xl border transition-shadow hover:shadow-lg"
                  style={{
                    animationDelay: `${Math.min(index * 80, 500)}ms`,
                  }}
                >
                  {post.coverImage ? (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={buildCloudinaryUrl(post.coverImage, 700)}
                        alt={post.title}
                        fill
                        sizes="(max-width: 48rem) 100vw, (max-width: 75rem) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <h3 className="text-foreground mb-2 line-clamp-2 text-lg leading-snug font-semibold">
                      {post.title}
                    </h3>
                    {post.excerpt ? (
                      <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {post.tags
                        .filter((tag) => !isSeriesTag(tag))
                        .slice(0, 3)
                        .map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                      {post.publishedAt ? (
                        <time
                          dateTime={post.publishedAt}
                          className="text-muted-foreground text-sm"
                        >
                          {new Date(post.publishedAt).toLocaleDateString(
                            locale,
                          )}
                        </time>
                      ) : (
                        <span />
                      )}
                      <span className="text-primary text-xs font-medium">
                        {labels.readMore}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? labels.loading : labels.loadMore}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
