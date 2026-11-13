import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { BlogForm } from "@/features/blog/components/blog-form";
import { getBlogCreatePageData } from "@/features/blog/server/blog-queries";

interface NewBlogPostPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ series?: string }>;
}

export default async function NewBlogPostPage({
  params,
  searchParams,
}: NewBlogPostPageProps) {
  const [{ locale }, resolvedParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const [t, { initialData, languages, availableSeries }] = await Promise.all([
    getTranslations({ locale, namespace: "admin.blog" }),
    getBlogCreatePageData(resolvedParams?.series, locale),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <BlogForm
          initialData={initialData}
          languages={languages}
          availableSeries={availableSeries}
        />
      </div>
    </div>
  );
}
