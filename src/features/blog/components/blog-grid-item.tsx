"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatBlogDate } from "@/features/blog/lib/blog-date";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { BlogPostThumbnail } from "./blog-post-thumbnail";
import { cn } from "@/lib/utils";

interface GridItemPost {
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

interface BlogGridItemProps {
  post: GridItemPost;
  locale: string;
  onSelectSeries: (series: string) => void;
  onSelectTag: (tag: string) => void;
}

export function BlogGridItem({
  post,
  locale,
  onSelectSeries,
  onSelectTag,
}: BlogGridItemProps) {
  const t = useTranslations("main.blog");
  const formattedDate = formatBlogDate(post.publishedAt, locale);
  const cleanTags = post.tags.filter((tag) => !isSeriesTag(tag)).slice(0, 3);

  return (
    <article
      className={cn(
        "group border-border bg-card hover:border-primary/40 relative",
        "flex flex-col overflow-hidden rounded-2xl border p-3 transition",
        "hover:shadow-primary/5 hover:shadow-lg",
      )}
    >
      <BlogPostThumbnail
        src={post.coverImage}
        title={post.title}
        slug={post.slug}
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-1 flex-col px-1.5 pt-4 pb-2">
        {/* Meta row */}
        <div
          className={cn(
            "text-muted-foreground flex flex-wrap items-center",
            "gap-x-2 gap-y-1 text-xs",
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
                "hover:text-primary relative z-10 inline-flex max-w-[12rem]",
                "items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
                "focus-visible:outline-primary transition-colors focus-visible:outline-2",
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
              <Clock className="size-3" aria-hidden="true" />
              <span>{t("minRead", { minutes: post.readingTime })}</span>
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-foreground group-hover:text-primary mt-3 text-lg",
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
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {post.excerpt}
          </p>
        ) : null}

        {/* Tags row */}
        {cleanTags.length > 0 ? (
          <div className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-4">
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
        ) : null}
      </div>
    </article>
  );
}
