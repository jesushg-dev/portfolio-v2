import { getLocale, getTranslations } from "next-intl/server";

import { BlogPostsGrid } from "@/features/blog/components/blog-posts-grid";

interface BlogTagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function BlogTagPage({ params }: BlogTagPageProps) {
  const { tag } = await params;
  const activeLocale = await getLocale();
  const t = await getTranslations("main.blog");
  const decodedTag = decodeURIComponent(tag);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-10">
      <p className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
        {t("filterByTag")}
      </p>
      <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
        #{decodedTag}
      </h1>
      <p className="text-muted-foreground mb-12 text-lg">{t("subtitle")}</p>

      <BlogPostsGrid
        locale={activeLocale}
        initialTag={decodedTag}
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
