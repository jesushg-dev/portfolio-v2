import type { FC } from "react";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ShowcaseHeading, ShowcaseSection } from "@/components/shared/showcase";
import { isSeriesTag } from "@/features/blog/lib/blog-headings";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/server";
import { HomeBlogPost } from "./home-blog-post";

interface HomeBlogProps {
  locale: Locale;
}

const HomeBlog: FC<HomeBlogProps> = async ({ locale }) => {
  const t = await getTranslations({ locale, namespace: "main.homeBlog" });
  const [data, seriesList] = await Promise.all([
    api.blog.list({ locale, limit: 12 }),
    api.blog.getSeries({ locale }),
  ]);

  if (data.posts.length === 0) return null;

  const seriesCountMap = new Map<string, number>();
  for (const s of seriesList) {
    seriesCountMap.set(s.id, s.count);
    if (s.slug) seriesCountMap.set(s.slug, s.count);
  }

  const seenSeries = new Set<string>();
  const selectedIds = new Set(
    data.posts
      .filter((post) => {
        const seriesKey = post.seriesId ?? post.seriesSlug;
        if (!seriesKey) return true;
        if (seenSeries.has(seriesKey)) return false;
        seenSeries.add(seriesKey);
        return true;
      })
      .slice(0, 4)
      .map((post) => post.id),
  );

  for (const post of data.posts) {
    if (selectedIds.size === 4) break;
    selectedIds.add(post.id);
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const [featured, ...latest] = data.posts
    .filter((post) => selectedIds.has(post.id))
    .map((post) => {
      const seriesTotal =
        (post.seriesId ? seriesCountMap.get(post.seriesId) : undefined) ??
        (post.seriesSlug ? seriesCountMap.get(post.seriesSlug) : undefined);
      let partLabel: string | undefined;
      if (post.seriesOrder !== null) {
        partLabel = seriesTotal
          ? t("partOfTotal", { part: post.seriesOrder, total: seriesTotal })
          : t("part", { part: post.seriesOrder });
      }

      return {
        ...post,
        topic: post.seriesName ?? post.tags.find((tag) => !isSeriesTag(tag)),
        dateLabel: post.publishedAt
          ? dateFormatter.format(new Date(post.publishedAt))
          : undefined,
        partLabel,
        minReadLabel: t("minRead", { count: post.readingTime }),
      };
    });

  if (!featured) return null;

  return (
    <ShowcaseSection ariaLabelledBy="blog-heading" className="md:py-20">
      <ShowcaseHeading
        sectionId="blog"
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("description")}
        align="split"
        className="mb-12"
        action={
          <Link
            href={{ pathname: "/blog" }}
            className="group text-primary hover:text-foreground focus-visible:outline-primary inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold transition-colors focus-visible:outline-2"
          >
            <span>{t("browseAll")}</span>
            <ChevronRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        }
      />

      <div
        data-phone-origin
        className={cn(
          "phone-spread grid gap-4 sm:gap-5",
          latest.length > 0 && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]",
        )}
      >
        <article className="min-w-0">
          <HomeBlogPost post={featured} readPostLabel={t("readPost")} />
        </article>

        {latest.length > 0 ? (
          <div className="home-card-surface bg-card min-w-0 rounded-4xl p-6 sm:p-8 [[data-color-mode=dark]_&]:bg-[color-mix(in_srgb,var(--card)_94%,var(--foreground))]">
            <h3
              id="home-blog-latest"
              className="text-muted-foreground mb-5 font-mono text-sm font-medium tracking-widest uppercase"
            >
              {t("latest")}
            </h3>
            <ul
              aria-labelledby="home-blog-latest"
              className="divide-border divide-y"
            >
              {latest.map((post) => (
                <li key={post.id} className="py-5 first:pt-0 last:pb-0">
                  <HomeBlogPost post={post} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ShowcaseSection>
  );
};

export default HomeBlog;
