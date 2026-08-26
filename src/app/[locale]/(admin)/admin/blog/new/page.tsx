import { getTranslations } from "next-intl/server";

import { BlogForm } from "@/features/blog/components/blog-form";
import { getBlogCreatePageData } from "@/features/blog/server/blog-queries";

export default async function NewBlogPostPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.blog"),
    getBlogCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <BlogForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
