"use client";

import { ArrowRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatBlogDate } from "@/features/blog/lib/blog-date";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { BlogPostThumbnail } from "./blog-post-thumbnail";
import { cn } from "@/lib/utils";

interface FeedItemPost {
  id: string;
  slug: string;
  coverImage: string | null;
  tags: string[];
  seriesSlug?: string | null;
  seriesName: string | null;
  seriesOrder: number | null;
  publishedAt: string | null;
  title: string;
  excerpt: string;
  readingTime: number;
}

interface BlogFeedItemProps {
  post: FeedItemPost;
  locale: string;
  onSelectSeries: (series: string) => void;
  onSelectTag: (tag: string) => void;
}

export function BlogFeedItem({
  post,
  locale,
  onSelectSeries,
  onSelectTag,
}: BlogFeedItemProps) {
  const t = useTranslations("main.blog");
  const formattedDate = formatBlogDate(post.publishedAt, locale);
  const cleanTags = post.tags.filter((tag) => !isSeriesTag(tag)).slice(0, 4);

  return (
    <article
      className={cn(
        "group border-border relative grid gap-4 border-b py-7",
        "first:pt-3 sm:grid-cols-[1fr_13.75rem] sm:gap-6",
      )}
    >
      <div className="min-w-0 sm:order-1">
        {/* Meta row */}
        <div
          className={cn(
            "text-muted-foreground flex flex-wrap items-center",
            "gap-x-3 gap-y-1.5 text-xs",
          )}
        >
          {post.seriesName ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const target = post.seriesSlug ?? post.seriesName;
                if (target) onSelectSeries(target);
              }}
              className={cn(
                "border-border bg-card text-foreground hover:border-primary/40",
                "hover:text-primary relative z-10 inline-flex max-w-[15rem]",
                "items-center gap-1.5 rounded-full border px-2.5 py-0.5",
                "font-semibold transition-colors focus-visible:outline-2",
                "focus-visible:outline-primary",
              )}
            >
              <span className="truncate">{post.seriesName}</span>
              {post.seriesOrder ? (
                <span className="text-primary font-medium">
                  #{post.seriesOrder}
                </span>
              ) : null}
            </button>
          ) : null}

          {formattedDate ? (
            <time dateTime={post.publishedAt ?? undefined}>
              {formattedDate}
            </time>
          ) : null}

          {post.readingTime ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              <span>{t("minRead", { minutes: post.readingTime })}</span>
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-foreground group-hover:text-primary mt-3 text-xl",
            "leading-snug font-bold tracking-tight transition-colors",
          )}
        >
          <Link
            href={{
              pathname: "/blog/[slug]",
              params: { slug: post.slug },
            }}
            className={cn(
              "after:absolute after:inset-0 focus-visible:outline-2",
              "focus-visible:outline-primary",
            )}
          >
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.excerpt ? (
          <p
            className={cn(
              "text-muted-foreground mt-2 line-clamp-2 max-w-prose",
              "text-[0.9375rem] leading-relaxed",
            )}
          >
            {post.excerpt}
          </p>
        ) : null}

        {/* Bottom row: tags + read article */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative z-10 flex flex-wrap gap-1.5">
            {cleanTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTag(tag);
                }}
                className={cn(
                  "bg-muted text-primary hover:bg-primary",
                  "hover:text-primary-foreground rounded-full px-2.5",
                  "py-0.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-primary focus-visible:outline-2",
                )}
              >
                #{tag}
              </button>
            ))}
          </div>

          <span
            className={cn(
              "text-primary inline-flex items-center gap-1",
              "text-sm font-semibold",
            )}
          >
            <span>{t("readArticle")}</span>
            <ArrowRight
              className={cn(
                "size-4 transition-transform",
                "group-hover:translate-x-0.5",
              )}
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      <BlogPostThumbnail
        src={post.coverImage}
        title={post.title}
        slug={post.slug}
        className={cn(
          "aspect-[16/10] w-full transition sm:order-2 sm:self-start",
          "group-hover:shadow-primary/10 group-hover:shadow-lg",
        )}
      />
    </article>
  );
}
