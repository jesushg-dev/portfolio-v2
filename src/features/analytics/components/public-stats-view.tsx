import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { RankList } from "@/features/analytics/components/rank-list";
import { countryDisplayName } from "@/features/analytics/lib/country-display-name";
import type { AnalyticsSummary } from "@/features/analytics/lib/summarize";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { Link } from "@/i18n/routing";

interface PublicStatsViewProps {
  traffic: AnalyticsSummary;
  portfolio: {
    projectsCount: number;
    certificationsCount: number;
    yearsExperience: number;
  };
  services: { id: string; title: string; type: string }[];
}

export async function PublicStatsView({
  traffic,
  portfolio,
  services,
}: PublicStatsViewProps) {
  const t = await getTranslations("main.stats");
  const locale = await getLocale();
  const format = await getFormatter();
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  const highlights = [
    {
      label: t("kpis.pageviews"),
      value: formatCount(traffic.pageviews),
    },
    {
      label: t("kpis.visits"),
      value: formatCount(traffic.visits),
    },
    {
      label: t("kpis.countries"),
      value: formatCount(traffic.countryCount),
    },
    {
      label: t("kpis.projects"),
      value: formatCount(portfolio.projectsCount),
    },
    {
      label: t("kpis.certifications"),
      value: formatCount(portfolio.certificationsCount),
    },
    {
      label: t("kpis.years"),
      value: `${formatCount(portfolio.yearsExperience)}+`,
    },
  ];

  return (
    <ProcessPageShell>
      <div className="mx-auto max-w-5xl px-4 lg:container lg:px-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-foreground mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
            {t("description")}
          </p>
        </header>

        <section
          aria-labelledby="stats-highlights"
          className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3"
        >
          <h2 id="stats-highlights" className="sr-only">
            {t("highlightsTitle")}
          </h2>
          {highlights.map((item) => (
            <div
              key={item.label}
              className="bg-card border-border rounded-2xl border px-4 py-5"
            >
              <p className="text-foreground text-2xl font-semibold tabular-nums md:text-3xl">
                {item.value}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{item.label}</p>
            </div>
          ))}
        </section>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section aria-labelledby="stats-countries">
            <h2
              id="stats-countries"
              className="text-foreground text-lg font-semibold tracking-tight"
            >
              {t("countriesTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 mb-6 text-sm">
              {t("windowHint")}
            </p>
            <RankList
              emptyLabel={t("emptyTraffic")}
              valueLabel={(count) => t("pageviewsCount", { count })}
              items={traffic.countries.map((item) => ({
                key: item.key,
                pageviews: item.pageviews,
                label: countryDisplayName(
                  item.key,
                  locale,
                  t("unknownCountry"),
                ),
              }))}
            />
          </section>
          <section aria-labelledby="stats-pages">
            <h2
              id="stats-pages"
              className="text-foreground text-lg font-semibold tracking-tight"
            >
              {t("pagesTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 mb-6 text-sm">
              {t("windowHint")}
            </p>
            <RankList
              emptyLabel={t("emptyTraffic")}
              valueLabel={(count) => t("pageviewsCount", { count })}
              items={traffic.paths.map((item) => ({
                key: item.key,
                pageviews: item.pageviews,
                label: item.key,
              }))}
            />
          </section>
        </div>

        <section aria-labelledby="stats-services" className="mt-12">
          <h2
            id="stats-services"
            className="text-foreground text-lg font-semibold tracking-tight"
          >
            {t("servicesTitle")}
          </h2>
          {services.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              {t("emptyServices")}
            </p>
          ) : (
            <ul className="mt-4 divide-y rounded-2xl border">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-foreground text-sm font-medium">
                    {service.title}
                  </span>
                  <span className="text-muted-foreground text-sm tracking-wide uppercase">
                    {service.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-muted-foreground mt-10 text-center text-sm">
          {t.rich("privacyNote", {
            link: (chunks) => (
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </ProcessPageShell>
  );
}
