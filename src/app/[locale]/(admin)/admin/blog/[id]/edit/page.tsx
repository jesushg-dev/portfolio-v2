import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { BlogForm } from "@/features/blog/components/blog-form";
import { getBlogEditPageData } from "@/features/blog/server/blog-queries";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string; locale: Locale }>;
}) {
  const { id, locale } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations({ locale, namespace: "admin.blog" }),
    getBlogEditPageData(id, locale),
  ]);

  if (!pageData) return null;
  const { editorDto, languages } = pageData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <BlogForm
          key={editorDto.id}
          initialData={editorDto}
          languages={languages}
          availableSeries={pageData.availableSeries}
        />
      </div>
    </div>
  );
}
