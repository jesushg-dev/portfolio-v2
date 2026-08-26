import { getLocale, getTranslations } from "next-intl/server";

import { BlogPostsGrid } from "@/features/blog/components/blog-posts-grid";
import { Link } from "@/i18n/routing";

interface BlogSeriesDetailPageProps {
  params: Promise<{ series: string }>;
}

export default async function BlogSeriesDetailPage({
  params,
}: BlogSeriesDetailPageProps) {
  const { series } = await params;
  const activeLocale = await getLocale();
  const t = await getTranslations("main.blog");
  const decoded = decodeURIComponent(series);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-10">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link
          href={{ pathname: "/blog" }}
          className="text-primary hover:text-primary/80 inline-flex text-sm font-medium transition-colors"
        >
          ← {t("backToBlog")}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href={{ pathname: "/blog/series" }}
          className="text-primary hover:text-primary/80 inline-flex text-sm font-medium transition-colors"
        >
          {t("seriesTitle")}
        </Link>
      </div>

      <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
        {t("series")}: {decoded}
      </h1>
      <p className="text-muted-foreground mb-12 text-lg">{t("seriesSubtitle")}</p>

      <BlogPostsGrid
        locale={activeLocale}
        initialSeriesName={decoded}
        labels={{
          empty: t("empty"),
          readMore: t("readMore"),
          featured: t("featured"),
          searchPlaceholder: t("searchPlaceholder"),
          filterByTag: t("filterByTag"),
          clearFilters: t("clearFilters"),
          loadMore: t("loadMore"),
          loading: t("loading"),
        }}
      />
    </section>
  );
}
