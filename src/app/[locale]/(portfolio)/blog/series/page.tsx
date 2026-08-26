import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { api } from "@/trpc/server";

export default async function BlogSeriesPage() {
  const locale = await getLocale();
  const t = await getTranslations("main.blog");
  const series = await api.blog.getSeries({ locale });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-10">
      <Link
        href={{ pathname: "/blog" }}
        className="text-primary hover:text-primary/80 mb-6 inline-flex text-sm font-medium transition-colors"
      >
        ← {t("backToBlog")}
      </Link>
      <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
        {t("seriesTitle")}
      </h1>
      <p className="text-muted-foreground mb-10 text-lg">{t("seriesSubtitle")}</p>

      {series.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {series.map((item) => (
            <Link
              key={item.name}
              href={{
                pathname: "/blog/series/[series]",
                params: { series: item.name },
              }}
              className="border-border bg-card hover:bg-accent/40 rounded-xl border p-5 transition-colors"
            >
              <p className="text-foreground text-xl font-semibold">#{item.name}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {t("postsCount", { count: item.count })}
              </p>
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {item.sampleTitle}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
