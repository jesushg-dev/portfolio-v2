import { Award, Briefcase, Code, Eye, Globe2, MapPin } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { RankList } from "@/features/analytics/components/rank-list";
import { countryDisplayName } from "@/features/analytics/lib/country-display-name";
import type { AdminOverviewData } from "@/features/analytics/lib/admin-overview-types";
import { Link } from "@/i18n/routing";
import NextLink from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="text-muted-foreground mt-1 truncate text-sm">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export async function AdminOverview({ data }: { data: AdminOverviewData }) {
  const t = await getTranslations("admin.dashboard");
  const locale = await getLocale();
  const format = await getFormatter();

  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  const jobItems = [
    { key: "applied", value: data.jobs.applied },
    { key: "inProgress", value: data.jobs.inProgress },
    { key: "offers", value: data.jobs.offers },
    { key: "ghosted", value: data.jobs.ghosted },
    { key: "rejected", value: data.jobs.rejected },
    { key: "hired", value: data.jobs.hired },
  ] as const;

  const inventory = [
    {
      href: "/admin/certifications" as const,
      count: data.inventory.certifications,
      icon: Award,
      title: t("stats.certificates.title"),
    },
    {
      href: "/admin/projects" as const,
      count: data.inventory.projects,
      icon: Briefcase,
      title: t("stats.projects.title"),
    },
    {
      href: "/admin/skills" as const,
      count: data.inventory.skills,
      icon: Code,
      title: t("stats.skills.title"),
    },
  ];

  return (
    <div className="space-y-10">
      {!data.hasProfile ? (
        <Card className="border-border bg-muted/40 border ring-0">
          <CardHeader>
            <CardTitle className="text-foreground">{t("noProfile")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.rich("noProfileHint", {
                link: (chunks) => (
                  <Link
                    href="/admin/settings"
                    className="font-medium underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("traffic.title")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("traffic.subtitle")}
            </p>
          </div>
          <Link
            href="/stats"
            className="text-foreground text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t("traffic.viewPublic")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={t("traffic.pageviews")}
            value={formatCount(data.traffic.pageviews)}
          />
          <KpiCard
            label={t("traffic.visits")}
            value={formatCount(data.traffic.visits)}
          />
          <KpiCard
            label={t("traffic.countries")}
            value={formatCount(data.traffic.countryCount)}
          />
          <KpiCard
            label={t("traffic.topPage")}
            value={data.traffic.topPath ?? t("traffic.emptyValue")}
            hint={
              data.traffic.topPath
                ? t("traffic.pageviewsCount", {
                    count: data.traffic.paths[0]?.pageviews ?? 0,
                  })
                : undefined
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("jobs.title")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("jobs.subtitle", {
                applications: data.jobs.totalApplications,
                companies: data.jobs.totalCompanies,
              })}
            </p>
          </div>
          <Link
            href="/admin/job-tracker"
            className="text-foreground text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t("jobs.openTracker")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {jobItems.map((item) => (
            <Card key={item.key} className="py-4">
              <CardContent className="px-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCount(item.value)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t(`jobs.${item.key}`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("jobs.upcoming")}</CardTitle>
            <CardDescription>{t("jobs.upcomingHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("jobs.noUpcoming")}
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {data.upcomingEvents.map((event) => (
                  <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={{
                        pathname: "/admin/job-tracker/applications/[id]",
                        params: { id: event.application.id },
                      }}
                      className="hover:bg-muted/40 -mx-2 flex flex-col gap-1 rounded-lg px-2 py-1"
                    >
                      <span className="text-foreground text-sm font-medium">
                        {event.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {event.application.company.name} ·{" "}
                        {event.application.position} ·{" "}
                        {format.dateTime(event.scheduledDate, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden />
              {t("traffic.countriesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankList
              emptyLabel={t("traffic.empty")}
              valueLabel={(count) => t("traffic.pageviewsCount", { count })}
              items={data.traffic.countries.map((item) => ({
                key: item.key,
                pageviews: item.pageviews,
                label: countryDisplayName(
                  item.key,
                  locale,
                  t("traffic.unknownCountry"),
                ),
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4" aria-hidden />
              {t("traffic.pagesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankList
              emptyLabel={t("traffic.empty")}
              valueLabel={(count) => t("traffic.pageviewsCount", { count })}
              items={data.traffic.paths.map((item) => ({
                key: item.key,
                pageviews: item.pageviews,
                label: item.key,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="size-4" aria-hidden />
            {t("traffic.referrersTitle")}
          </CardTitle>
          <CardDescription>{t("traffic.referrersHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RankList
            emptyLabel={t("traffic.emptyReferrers")}
            valueLabel={(count) => t("traffic.pageviewsCount", { count })}
            items={data.traffic.referrers.map((item) => ({
              key: item.key,
              pageviews: item.pageviews,
              label: item.key,
            }))}
          />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("services.title")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("services.subtitle")}
            </p>
          </div>
          <Link
            href="/admin/services"
            className="text-foreground text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t("manage")}
          </Link>
        </div>
        {data.services.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("services.empty")}</p>
        ) : (
          <ul className="divide-border divide-y rounded-xl border">
            {data.services.map((service) => (
              <li key={service.id}>
                <NextLink
                  href={`/admin/services/${service.id}/edit`}
                  className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {service.title}
                    </p>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      {service.type}
                      {service.featured ? ` · ${t("services.featured")}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      service.isActive
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {service.isActive
                      ? t("services.active")
                      : t("services.inactive")}
                  </span>
                </NextLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("inventory.title")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {inventory.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-card hover:bg-muted/40 border-border flex items-center gap-3 rounded-xl border px-4 py-3"
              >
                <span className="bg-muted text-foreground inline-flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-semibold tabular-nums">
                    {formatCount(item.count)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.title}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
