import { getTranslations } from "next-intl/server";

import { BlogForm } from "@/features/blog/components/blog-form";
import { getBlogEditPageData } from "@/features/blog/server/blog-queries";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.blog"),
    getBlogEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, languages } = pageData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("editDescription")}</p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <BlogForm key={editorDto.id} initialData={editorDto} languages={languages} />
      </div>
    </div>
  );
}
