import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { BlogPostsGrid } from "@/features/blog/components/blog-posts-grid";

export { generateMetadata } from "./metadata";
export { publicBlogSeriesParams as generateStaticParams } from "@/lib/public-site/static-params";

interface SeriesDetailPageProps {
  params: Promise<{ locale: Locale; series: string }>;
}

export default async function BlogSeriesDetailPage({
  params,
}: SeriesDetailPageProps) {
  const { locale, series } = await params;
  const t = await getTranslations({ locale, namespace: "main.blog" });
  const decoded = decodeURIComponent(series);

  const [seriesMeta, initialData, initialTags] = await Promise.all([
    api.blog.getSeriesBySlug({ slug: decoded, locale }),
    api.blog.list({
      locale,
      limit: 50,
      seriesSlug: decoded,
    }),
    api.blog.getTags({ seriesSlug: decoded }),
  ]);

  if (!seriesMeta && initialData.posts.length === 0) notFound();

  const title = seriesMeta?.title ?? decoded;
  const description = seriesMeta?.description ?? null;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <section
        className={
          "bg-[radial-gradient(ellipse_60%_60%_at_50%_0%," +
          "color-mix(in_srgb,var(--primary)_20%,transparent)," +
          "transparent_70%)] pt-28 pb-14 text-center"
        }
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
          <Link
            href={{ pathname: "/blog/series" }}
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("browseSeries")}</span>
          </Link>

          <p className="text-primary mb-3 text-sm font-medium tracking-normal">
            {t("series")}
          </p>
          <h1 className="text-foreground mx-auto max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
              {description}
            </p>
          ) : null}
          <p className="text-muted-foreground mx-auto mt-2 text-sm font-medium">
            {t("postsCount", { count: initialData.posts.length })}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full px-4 pb-28 sm:px-6 md:pb-36 lg:container lg:px-20">
        <BlogPostsGrid
          locale={locale}
          initialSeriesSlug={seriesMeta?.slug ?? decoded}
          initialSeriesName={title}
          initialPosts={initialData.posts}
          initialNextCursor={initialData.nextCursor}
          initialTotal={initialData.total}
          initialTags={initialTags}
        />
      </section>
    </div>
  );
}
