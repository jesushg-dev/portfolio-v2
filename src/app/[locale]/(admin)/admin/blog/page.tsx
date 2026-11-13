import type { FC } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { BlogPostsList } from "@/features/blog/components/blog-posts-list";
import { getUserBlogPosts } from "@/features/blog/server/blog-queries";

interface BlogPageProps {
  params: Promise<{ locale: Locale }>;
}

const BlogPage: FC<BlogPageProps> = async ({ params }) => {
  const { locale } = await params;
  const [
    t,
    {
      data: initialPosts,
      series: initialSeries,
      standalone: initialStandalone,
    },
  ] = await Promise.all([
    getTranslations({ locale, namespace: "admin.blog" }),
    getUserBlogPosts(locale),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <BlogPostsList
          initialPosts={initialPosts}
          initialSeries={initialSeries}
          initialStandalone={initialStandalone}
        />
      </div>
    </div>
  );
};

export default BlogPage;
