import type { FC } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export interface CompactBlogPost {
  id: string;
  slug: string;
  title: string;
  readingTime: number;
  seriesName: string | null;
  seriesOrder: number | null;
  tags: string[];
  coverImage: string | null;
}

export interface CompactBlogCardProps {
  post: CompactBlogPost;
  seriesTotal?: number;
  partLabel: string;
  minReadLabel: string;
}

function getPostHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export const CompactBlogCard: FC<CompactBlogCardProps> = ({
  post,
  partLabel,
  minReadLabel,
}) => {
  const hue = getPostHue(post.slug || post.title);

  return (
    <article className="group border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30 relative flex flex-col rounded-2xl border p-3 shadow-2xs transition-colors">
      {post.coverImage ? (
        <div className="border-border/40 bg-muted/40 relative aspect-[16/6] overflow-hidden rounded-lg border">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 48rem) 100vw, 33vw"
          />
        </div>
      ) : (
        <div
          className="border-border/40 relative aspect-[16/6] overflow-hidden rounded-lg border"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 50% 18%), hsl(${hue + 25} 45% 30%))`,
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-x-[10%] top-[22%] bottom-0 rounded-t-md bg-white/10 p-2 backdrop-blur-xs">
            <i className="block h-1.5 w-1/3 rounded-full bg-white/40" />
            <i className="mt-1.5 block h-1 w-3/5 rounded-full bg-white/25" />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span className="border-primary/30 bg-primary/10 text-primary inline-flex max-w-[75%] min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold">
            {post.seriesName ? (
              <>
                <span className="min-w-0 truncate">{post.seriesName}</span>
                <span className="shrink-0 font-mono text-sm opacity-80">
                  {partLabel}
                </span>
              </>
            ) : post.tags.length > 0 ? (
              <span className="truncate">#{post.tags[0]}</span>
            ) : (
              <span className="truncate">#blog</span>
            )}
          </span>
          <span className="shrink-0 font-mono text-sm">{minReadLabel}</span>
        </div>

        <h3 className="text-foreground group-hover:text-primary mt-2.5 line-clamp-2 text-sm leading-snug font-bold transition-colors sm:text-base">
          <Link
            href={{
              pathname: "/blog/[slug]",
              params: { slug: post.slug },
            }}
            className="inline-flex min-h-11 items-center focus-visible:outline-primary after:absolute after:inset-0 focus-visible:outline-2"
          >
            {post.title}
          </Link>
        </h3>
      </div>
    </article>
  );
};
