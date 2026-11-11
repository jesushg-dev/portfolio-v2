import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { Link } from "@/i18n/routing";
import { BlogPostsGrid } from "@/features/blog/components/blog-posts-grid";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";

export { generateMetadata } from "./metadata";

interface BlogPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "main.blog" });

  const [initialData, initialTags, seriesList] = await Promise.all([
    api.blog.list({ locale, limit: 9 }),
    api.blog.getTags({}),
    api.blog.getSeries({ locale }),
  ]);

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
            href="/"
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("backToHome")}</span>
          </Link>

          <p className="text-primary mb-3 text-sm font-medium tracking-normal">
            {t("eyebrow")}
          </p>
          <h1 className="text-foreground mx-auto max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href={{ pathname: "/blog/series" }}
              className="border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
            >
              <Layers className="text-primary size-3.5" aria-hidden="true" />
              <span>{t("browseSeries")}</span>
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 md:pb-36 lg:px-10">
        <BlogPostsGrid
          locale={locale}
          initialPosts={initialData.posts}
          initialNextCursor={initialData.nextCursor}
          initialTags={initialTags}
          seriesList={seriesList}
        />
      </section>
    </div>
  );
}
