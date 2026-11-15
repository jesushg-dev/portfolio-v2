import type { FC } from "react";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ShowcaseHeading, ShowcaseSection } from "@/components/shared/showcase";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { CompactBlogCard } from "./compact-blog-card";

interface HomeBlogProps {
  locale: Locale;
}

const HomeBlog: FC<HomeBlogProps> = async ({ locale }) => {
  const t = await getTranslations({ locale, namespace: "main.homeBlog" });
  const [data, seriesList] = await Promise.all([
    api.blog.list({ locale, limit: 12 }),
    api.blog.getSeries({ locale }),
  ]);

  if (!data?.posts || data.posts.length === 0) return null;

  const seriesCountMap = new Map<string, number>();
  for (const s of seriesList) {
    seriesCountMap.set(s.id, s.count);
    if (s.slug) seriesCountMap.set(s.slug, s.count);
  }

  // Pick top 3 posts with at most one chapter per series (most recent first)
  const seenSeries = new Set<string>();
  const compactPosts = data.posts
    .filter((post) => {
      const seriesKey = post.seriesId ?? post.seriesSlug;
      if (!seriesKey) return true;
      if (seenSeries.has(seriesKey)) return false;
      seenSeries.add(seriesKey);
      return true;
    })
    .slice(0, 3);

  if (compactPosts.length === 0) return null;

  return (
    <ShowcaseSection ariaLabelledBy="blog-heading">
      <ShowcaseHeading
        sectionId="blog"
        eyebrow={t("eyebrow")}
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("description")}
        align="split"
        action={
          <Link
            href={{ pathname: "/blog" }}
            className="group text-primary hover:text-foreground focus-visible:outline-primary inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold transition-colors focus-visible:outline-2"
          >
            <span>{t("browseAll")}</span>
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {compactPosts.map((post) => {
          const seriesTotal =
            (post.seriesId ? seriesCountMap.get(post.seriesId) : undefined) ??
            (post.seriesSlug ? seriesCountMap.get(post.seriesSlug) : undefined);
          const partText = t("part", {
            part: post.seriesOrder ?? 1,
            total: seriesTotal ?? "",
          });
          const minReadText = t("minRead", { count: post.readingTime });

          return (
            <CompactBlogCard
              key={post.id}
              post={post}
              seriesTotal={seriesTotal}
              partLabel={partText}
              minReadLabel={minReadText}
            />
          );
        })}
      </div>
    </ShowcaseSection>
  );
};

export default HomeBlog;
