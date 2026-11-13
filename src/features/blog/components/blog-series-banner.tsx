"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface BlogSeriesBannerProps {
  activeSeries: string;
  activeSeriesSlug?: string | null;
  seriesDescription?: string | null;
  seriesPostsCount: number;
  firstPostSlug?: string;
  firstPostOrder?: number | null;
  locale?: string;
}

export function BlogSeriesBanner({
  activeSeries,
  activeSeriesSlug,
  seriesDescription,
  seriesPostsCount,
  firstPostSlug,
  firstPostOrder,
}: BlogSeriesBannerProps) {
  const t = useTranslations("main.blog");

  return (
    <div
      className={cn(
        "border-border/80 bg-muted/40 mx-auto mt-2 mb-6 flex w-full",
        "flex-wrap items-center justify-between gap-3 rounded-2xl border p-4",
      )}
    >
      <div className="min-w-0">
        <p className="text-primary text-xs font-semibold">{t("series")}</p>
        <h2 className="text-foreground truncate text-lg font-bold">
          {activeSeries}
        </h2>
        {seriesDescription ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {seriesDescription}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">
          {t("postsCount", { count: seriesPostsCount })}, {t("bestReadInOrder")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {firstPostSlug ? (
          <Link
            href={{
              pathname: "/blog/[slug]",
              params: { slug: firstPostSlug },
            }}
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "focus-visible:outline-primary rounded-xl px-4 py-2 text-sm",
              "font-semibold transition-colors focus-visible:outline-2",
              "focus-visible:outline-offset-2",
            )}
          >
            {t("startWithPart", { part: firstPostOrder ?? 1 })}
          </Link>
        ) : null}

        <Link
          href={{
            pathname: "/blog/series/[series]",
            params: { series: activeSeriesSlug ?? activeSeries },
          }}
          className={cn(
            "border-border bg-card text-foreground hover:border-primary/40",
            "focus-visible:outline-primary rounded-xl border px-4 py-2 text-sm",
            "font-semibold transition-colors focus-visible:outline-2",
          )}
        >
          {t("seriesPage")}
        </Link>
      </div>
    </div>
  );
}
