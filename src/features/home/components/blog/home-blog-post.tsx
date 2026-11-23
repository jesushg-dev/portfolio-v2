import Image from "next/image";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface HomeBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  dateLabel?: string;
  topic?: string;
  partLabel?: string;
  minReadLabel: string;
}

interface HomeBlogPostProps {
  post: HomeBlogPost;
  readPostLabel?: string;
}

export function HomeBlogPost({ post, readPostLabel }: HomeBlogPostProps) {
  const featured = readPostLabel !== undefined;
  const Title = featured ? "h3" : "h4";

  return (
    <div
      className={cn(
        "group relative min-w-0",
        featured
          ? "home-card-surface bg-card h-full overflow-hidden rounded-4xl [[data-color-mode=dark]_&]:bg-[color-mix(in_srgb,var(--card)_94%,var(--foreground))]"
          : "rounded-sm",
      )}
    >
      {featured ? (
        <div
          data-phone-cover
          className="relative aspect-video overflow-hidden bg-linear-to-br from-indigo-600 to-sky-500"
        >
          <div className="absolute inset-[10%] overflow-hidden rounded-2xl border border-white/20 bg-white/15">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt=""
                fill
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                sizes="(min-width: 64rem) 44vw, 80vw"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-full flex-col justify-center gap-3 px-[10%]"
              >
                <span className="h-2.5 w-2/5 rounded-full bg-white/80" />
                <span className="h-1.5 w-4/5 rounded-full bg-white/45" />
                <span className="h-1.5 w-3/5 rounded-full bg-white/45" />
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className={featured ? "p-6 sm:p-8" : undefined}>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm tracking-wider uppercase">
          {post.topic ? (
            <span className="inline-flex max-w-[75%] min-w-0 items-center gap-2">
              <span className="truncate">{post.topic}</span>
              {post.partLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{post.partLabel}</span>
                </>
              ) : null}
            </span>
          ) : null}
          {post.dateLabel ? (
            <span className="inline-flex items-center gap-2">
              {post.topic ? <span aria-hidden="true">·</span> : null}
              <time dateTime={post.publishedAt ?? undefined}>
                {post.dateLabel}
              </time>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            {post.topic || post.dateLabel ? (
              <span aria-hidden="true">·</span>
            ) : null}
            {post.minReadLabel}
          </span>
        </p>

        <Title
          className={cn(
            "text-foreground group-hover:text-primary leading-tight font-semibold tracking-tight wrap-break-word transition-colors",
            featured ? "mt-3 text-2xl sm:text-3xl" : "mt-2 text-lg",
          )}
        >
          <Link
            href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
            className="focus-visible:after:outline-primary inline-block min-h-11 min-w-11 after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2"
          >
            {post.title}
          </Link>
        </Title>
        {post.excerpt ? (
          <p
            className={cn(
              "text-muted-foreground text-sm leading-relaxed wrap-break-word sm:text-base",
              featured ? "mt-3 line-clamp-3" : "mt-1.5 line-clamp-2",
            )}
          >
            {post.excerpt}
          </p>
        ) : null}

        {featured ? (
          <span
            aria-hidden="true"
            className="text-primary mt-5 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline"
          >
            {readPostLabel}
            <ChevronRight className="size-4" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
