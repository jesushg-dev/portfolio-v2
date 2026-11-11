import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { BlogPostsList } from "@/features/blog/components/blog-posts-list";
import { getUserBlogPosts } from "@/features/blog/server/blog-queries";

const BlogPage: FC = async () => {
  const [t, { data: initialPosts }] = await Promise.all([
    getTranslations("admin.blog"),
    getUserBlogPosts(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <BlogPostsList initialPosts={initialPosts} />
      </div>
    </div>
  );
};

export default BlogPage;
