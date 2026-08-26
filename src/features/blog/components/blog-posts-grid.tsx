"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import { buildCloudinaryUrl } from "@/utils/tools/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

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
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(initialTag ?? null);
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.blog.list.useInfiniteQuery(
    {
      locale: locale as "en" | "es" | "nl",
      limit: 9,
      tag: activeTag ?? undefined,
      seriesName: initialSeriesName,
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
    const set = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesQuery =
        q.length === 0 ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesTag = activeTag ? post.tags.includes(activeTag) : true;
      return matchesQuery && matchesTag;
    });
  }, [posts, query, activeTag]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  if (isLoading) {
    return <p className="text-muted-foreground text-center">{labels.loading}</p>;
  }

  if (posts.length === 0) {
    return <p className="text-muted-foreground text-center">{labels.empty}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border-border rounded-2xl border p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-10"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {labels.filterByTag}
            </span>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
              >
                <Badge variant={activeTag === tag ? "default" : "secondary"}>
                  {tag}
                </Badge>
              </button>
            ))}
            {(query || activeTag) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag(null);
                }}
                className="text-primary text-xs font-medium"
              >
                {labels.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center">{labels.empty}</p>
      ) : (
        <div className="space-y-8">
          {featured ? (
            <Link
              href={{ pathname: "/blog/[slug]", params: { slug: featured.slug } }}
              className="border-border bg-card group block overflow-hidden rounded-2xl border opacity-0 transition-all duration-500 hover:shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto md:min-h-[280px]">
                  {featured.coverImage ? (
                    <Image
                      src={buildCloudinaryUrl(featured.coverImage, 1200)}
                      alt={featured.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
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
                  <h2 className="text-foreground mb-3 text-2xl font-bold leading-tight md:text-3xl">
                    {featured.title}
                  </h2>
                  {featured.excerpt ? (
                    <p className="text-muted-foreground mb-5 line-clamp-3">
                      {featured.excerpt}
                    </p>
                  ) : null}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {featured.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {featured.publishedAt ? (
                    <time className="text-muted-foreground text-xs">
                      {new Date(featured.publishedAt).toLocaleDateString(locale)}
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
                href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                className="border-border bg-card group overflow-hidden rounded-xl border opacity-0 transition-all duration-500 hover:shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="text-foreground mb-2 line-clamp-2 text-lg font-semibold leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    {post.publishedAt ? (
                      <time className="text-muted-foreground text-xs">
                        {new Date(post.publishedAt).toLocaleDateString(locale)}
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
  );
}
