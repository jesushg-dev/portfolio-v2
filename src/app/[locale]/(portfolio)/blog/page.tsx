import { getLocale, getTranslations } from "next-intl/server";

import { BlogPostsGrid } from "@/features/blog/components/blog-posts-grid";
import { Link } from "@/i18n/routing";

export default async function BlogPage() {
  const activeLocale = await getLocale();
  const t = await getTranslations("main.blog");

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-10">
      <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mb-12 text-lg">{t("subtitle")}</p>
      <div className="mb-8">
        <Link
          href={{ pathname: "/blog/series" }}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          {t("browseSeries")} →
        </Link>
      </div>

      <BlogPostsGrid
        locale={activeLocale}
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
