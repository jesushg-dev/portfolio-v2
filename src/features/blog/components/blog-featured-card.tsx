"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatBlogDate } from "@/features/blog/lib/blog-date";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { BlogPostThumbnail } from "./blog-post-thumbnail";
import { cn } from "@/lib/utils";

interface FeaturedPost {
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

interface BlogFeaturedCardProps {
  post: FeaturedPost;
  locale: string;
  onSelectTag: (tag: string) => void;
}

export function BlogFeaturedCard({
  post,
  locale,
  onSelectTag,
}: BlogFeaturedCardProps) {
  const t = useTranslations("main.blog");
  const formattedDate = formatBlogDate(post.publishedAt, locale);
  const cleanTags = post.tags.filter((tag) => !isSeriesTag(tag)).slice(0, 4);

  return (
    <article
      className={cn(
        "group border-border from-card to-muted/50 bg-gradient-to-br",
        "hover:border-primary/40 relative mb-6 grid gap-5 rounded-2xl",
        "border p-4 transition-all hover:shadow-lg sm:grid-cols-[1fr_13.75rem]",
        "sm:items-center sm:p-5",
      )}
    >
      <div className="min-w-0 sm:order-1">
        <div
          className={cn(
            "text-muted-foreground flex flex-wrap items-center",
            "gap-x-3 gap-y-1.5 text-xs",
          )}
        >
          <span
            className={cn(
              "bg-primary text-primary-foreground rounded-full px-2.5",
              "py-0.5 font-semibold",
            )}
          >
            {t("featured")}
          </span>
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

        <h3
          className={cn(
            "text-foreground group-hover:text-primary mt-3 text-xl",
            "leading-snug font-extrabold tracking-tight transition-colors",
            "sm:text-2xl",
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

        {cleanTags.length > 0 ? (
          <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
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

      <BlogPostThumbnail
        src={post.coverImage}
        title={post.title}
        slug={post.slug}
        priority
        className="aspect-[16/10] w-full sm:order-2"
      />
    </article>
  );
}
