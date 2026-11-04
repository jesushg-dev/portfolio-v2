import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { RankList } from "@/features/analytics/components/rank-list";
import { DailyVisitsChart } from "@/features/analytics/components/daily-visits-chart";
import { countryDisplayName } from "@/features/analytics/lib/country-display-name";
import type { AnalyticsSummary } from "@/features/analytics/lib/summarize";
import {
  ShowcaseShell,
  ShowcaseHero,
  ShowcaseSection,
  MetricGrid,
  ServiceList,
} from "@/components/shared/showcase";
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

  const trafficHighlights = [
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
  ];

  const portfolioHighlights = [
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
    <ShowcaseShell>
      {/* Hero */}
      <ShowcaseHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      {/* Traffic KPI Metrics */}
      <ShowcaseSection variant="compact" ariaLabelledBy="stats-traffic-kpis">
        <h2 id="stats-traffic-kpis" className="sr-only">
          {t("highlightsTitle")}
        </h2>
        <MetricGrid items={trafficHighlights} />

        <DailyVisitsChart
          dailyVisits={traffic.dailyVisits}
          totalVisits={traffic.visits}
        />
      </ShowcaseSection>

      {/* Traffic Sources & Top Pages */}
      <ShowcaseSection>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
          <section aria-labelledby="stats-countries">
            <h2
              id="stats-countries"
              className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("countriesTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 mb-8 text-sm sm:text-base">
              {traffic.unknownCountryPercent > 0
                ? t("countriesHint", {
                    unknownPercent: traffic.unknownCountryPercent,
                  })
                : t("countriesHintSimple")}
            </p>
            <RankList
              variant="line"
              emptyLabel={t("emptyTraffic")}
              items={traffic.countries.map((item) => {
                const isOther = item.key.startsWith("OTHER:");
                const count = isOther ? item.key.slice("OTHER:".length) : "0";
                return {
                  key: item.key,
                  pageviews: item.pageviews,
                  label: isOther
                    ? t("otherCountries", { count })
                    : countryDisplayName(item.key, locale, t("unknownCountry")),
                  valueDisplay: t("pageviewsCount", {
                    count: item.pageviews,
                  }),
                };
              })}
            />
          </section>

          <section aria-labelledby="stats-pages">
            <h2
              id="stats-pages"
              className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("pagesTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 mb-8 text-sm sm:text-base">
              {t("pagesHint")}
            </p>
            <RankList
              variant="line"
              emptyLabel={t("emptyTraffic")}
              items={traffic.paths.map((item) => ({
                key: item.key,
                pageviews: item.pageviews,
                label: item.key,
                valueDisplay: t("pageviewsCount", { count: item.pageviews }),
              }))}
            />
          </section>
        </div>
      </ShowcaseSection>

      {/* Portfolio & Services */}
      <ShowcaseSection>
        <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {t("portfolioTitle")}
        </h2>
        <MetricGrid size="sm" items={portfolioHighlights} className="mt-8" />

        <h2 className="text-foreground mt-24 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("servicesTitle")}
        </h2>
        <ServiceList
          items={services.map((service) => ({
            id: service.id,
            title: service.title,
            badge: service.type,
          }))}
          emptyLabel={t("emptyServices")}
          className="mt-8"
        />

        <p className="text-muted-foreground mt-16 text-center text-sm">
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
      </ShowcaseSection>
    </ShowcaseShell>
  );
}
