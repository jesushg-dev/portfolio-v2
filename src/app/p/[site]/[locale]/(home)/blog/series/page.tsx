import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { BlogEmptyState } from "@/features/blog/components/blog-empty-state";

interface SeriesPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function BlogSeriesPage({ params }: SeriesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "main.blog" });
  const series = await api.blog.getSeries({ locale });

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
            href={{ pathname: "/blog" }}
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("backToBlog")}</span>
          </Link>

          <p className="text-primary mb-3 text-sm font-medium tracking-normal">
            {t("series")}
          </p>
          <h1 className="text-foreground mx-auto max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("seriesTitle")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t("seriesSubtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-28 sm:px-6 md:pb-36 lg:px-10">
        {series.length === 0 ? (
          <BlogEmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {series.map((s) => (
              <Link
                key={s.name}
                href={{
                  pathname: "/blog/series/[series]",
                  params: { series: s.name },
                }}
                className="border-border bg-card hover:border-primary/30 group rounded-2xl border p-6 transition-all hover:shadow-md"
              >
                <h2 className="text-foreground group-hover:text-primary mb-1 text-lg font-semibold tracking-tight transition-colors">
                  {s.name}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t("postsCount", { count: s.count })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
