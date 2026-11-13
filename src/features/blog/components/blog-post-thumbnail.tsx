"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface BlogPostThumbnailProps {
  src: string | null | undefined;
  title: string;
  slug: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function BlogPostThumbnail({
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
        <div
          className={cn(
            "from-primary/10 via-muted/40 to-background",
            "text-muted-foreground flex size-full min-h-24",
            "items-center justify-center bg-gradient-to-br p-4 select-none",
          )}
        >
          <div className="flex flex-col items-center gap-1.5 text-center">
            <BookOpen className="text-primary/70 size-6" aria-hidden="true" />
            <span
              className={cn(
                "text-muted-foreground/80 font-mono",
                "text-[0.625rem] tracking-widest uppercase",
              )}
            >
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
          className={cn(
            "object-cover transition-transform duration-300",
            "group-hover:scale-105",
          )}
          onError={() => setFailed(true)}
        />
      )}
    </Link>
  );
}
