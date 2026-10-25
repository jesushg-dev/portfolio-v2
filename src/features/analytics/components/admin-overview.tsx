"use client";

import { useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Award,
  Briefcase,
  Calendar,
  Code2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RankList } from "@/features/analytics/components/rank-list";
import { countryDisplayName } from "@/features/analytics/lib/country-display-name";
import type {
  AdminOverviewData,
  DashboardServiceRow,
} from "@/features/analytics/lib/admin-overview-types";
import type { UpcomingEventDTO } from "@/features/job-tracker/server/job-tracker-queries";
import { api } from "@/trpc/react";

type DashboardTranslation = ReturnType<
  typeof useTranslations<"admin.dashboard">
>;

export function AdminOverview({ data }: { data: AdminOverviewData }) {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale();
  const format = useFormatter();

  const [services, setServices] = useState<DashboardServiceRow[]>(
    data.services,
  );
  const [, startTransition] = useTransition();
  const toggleServiceMutation = api.servicesAdmin.toggleActive.useMutation();

  const handleToggleService = (id: string, nextActive: boolean) => {
    const previous = services;
    setServices((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isActive: nextActive } : item,
      ),
    );

    startTransition(async () => {
      try {
        await toggleServiceMutation.mutateAsync({ id, isActive: nextActive });
      } catch {
        setServices(previous);
        toast.error("Failed to update service status");
      }
    });
  };

  return (
    <div className="space-y-10">
      {!data.hasProfile ? (
        <Card className="border-border/60 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-foreground">{t("noProfile")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.rich("noProfileHint", {
                link: (chunks) => (
                  <Link
                    href="/admin/settings"
                    className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <VisitorsSection
        data={data.traffic}
        format={format}
        locale={locale}
        t={t}
      />

      <section
        className="grid gap-4 xl:grid-cols-3"
        aria-label={t("jobs.title")}
      >
        <div className="xl:col-span-2">
          <JobTrackerSection
            jobs={data.jobs}
            upcomingEvents={data.upcomingEvents}
            format={format}
            t={t}
          />
        </div>
        <div className="xl:col-span-1">
          <ReferrersCard referrers={data.traffic.referrers} t={t} />
        </div>
      </section>

      <section
        className="grid gap-4 xl:grid-cols-3"
        aria-label={t("services.title")}
      >
        <div className="xl:col-span-2">
          <ServicesCard
            services={services}
            onToggle={handleToggleService}
            t={t}
          />
        </div>
        <div className="xl:col-span-1">
          <ContentInventoryCard
            inventory={data.inventory}
            format={format}
            t={t}
          />
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  hint,
  label,
  value,
}: {
  hint?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="text-muted-foreground text-sm font-medium">{label}</div>
      <div className="text-foreground mt-3 truncate text-4xl font-bold tabular-nums">
        {value}
      </div>
      {hint ? (
        <div className="text-muted-foreground mt-2 truncate text-xs">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function VisitorsSection({
  data,
  format,
  locale,
  t,
}: {
  data: AdminOverviewData["traffic"];
  format: ReturnType<typeof useFormatter>;
  locale: string;
  t: DashboardTranslation;
}) {
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  const pagesPerVisit =
    data.visits > 0 ? (data.pageviews / data.visits).toFixed(1) : "0";

  const topCountry = data.countries[0];
  const topCountryPct =
    topCountry && data.pageviews > 0
      ? Math.round((topCountry.pageviews / data.pageviews) * 100)
      : null;
  const topCountryName = topCountry
    ? countryDisplayName(topCountry.key, locale, t("traffic.unknownCountry"))
    : null;

  const topPath = data.paths[0];
  const topPathPct =
    topPath && data.pageviews > 0
      ? Math.round((topPath.pageviews / data.pageviews) * 100)
      : null;

  return (
    <section aria-labelledby="heading-visitors" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="heading-visitors"
            className="text-foreground text-xl font-semibold tracking-tight"
          >
            {t("traffic.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("traffic.subtitle")}
          </p>
        </div>
        <Link
          href="/stats"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <span>{t("traffic.viewPublic")}</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("traffic.pageviews")}
          value={formatCount(data.pageviews)}
          hint={t("traffic.pagesPerVisit", { ratio: pagesPerVisit })}
        />
        <KpiCard
          label={t("traffic.visits")}
          value={formatCount(data.visits)}
          hint={t("traffic.last30Days")}
        />
        <KpiCard
          label={t("traffic.countries")}
          value={formatCount(data.countryCount)}
          hint={
            topCountryName && topCountryPct !== null
              ? t("traffic.mostFromCountry", {
                  country: topCountryName,
                  percentage: topCountryPct,
                })
              : t("traffic.last30Days")
          }
        />
        <KpiCard
          label={t("traffic.topPage")}
          value={data.topPath ?? t("traffic.emptyValue")}
          hint={
            topPath && topPathPct !== null
              ? t("traffic.pageviewsShare", {
                  views: formatCount(topPath.pageviews),
                  percentage: topPathPct,
                })
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="mb-4">
            <h3 className="text-foreground font-semibold">
              {t("traffic.countriesTitle")}
            </h3>
          </div>
          <RankList
            emptyLabel={t("traffic.empty")}
            items={data.countries.map((item) => ({
              key: item.key,
              pageviews: item.pageviews,
              label: countryDisplayName(
                item.key,
                locale,
                t("traffic.unknownCountry"),
              ),
            }))}
            limit={6}
            total={data.pageviews}
            showPercentage
            showAllLabel={t("traffic.showAll", {
              count: data.countries.length,
            })}
            showLessLabel={t("traffic.showLess")}
          />
        </div>

        <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="mb-4">
            <h3 className="text-foreground font-semibold">
              {t("traffic.pagesTitle")}
            </h3>
          </div>
          <RankList
            emptyLabel={t("traffic.empty")}
            items={data.paths.map((item) => ({
              key: item.key,
              pageviews: item.pageviews,
              label: item.key,
            }))}
            limit={6}
            total={data.pageviews}
            showPercentage
            showAllLabel={t("traffic.showAll", { count: data.paths.length })}
            showLessLabel={t("traffic.showLess")}
          />
        </div>
      </div>
    </section>
  );
}

function JobTrackerSection({
  format,
  jobs,
  t,
  upcomingEvents,
}: {
  format: ReturnType<typeof useFormatter>;
  jobs: AdminOverviewData["jobs"];
  t: DashboardTranslation;
  upcomingEvents: UpcomingEventDTO[];
}) {
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  return (
    <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            {t("jobs.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("jobs.subtitle", {
              applications: jobs.totalApplications,
              companies: jobs.totalCompanies,
            })}
          </p>
        </div>
        <Link
          href="/admin/job-tracker"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <span>{t("jobs.openTracker")}</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-primary/30 bg-primary/10 rounded-xl border p-4">
          <div className="text-primary text-2xl font-bold tabular-nums">
            {formatCount(jobs.applied)}
          </div>
          <div className="text-primary/80 mt-1 text-xs font-medium">
            {t("jobs.applied")}
          </div>
        </div>
        <div className="border-border/60 bg-card/60 rounded-xl border p-4">
          <div className="text-foreground text-2xl font-bold tabular-nums">
            {formatCount(jobs.inProgress)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {t("jobs.inProgress")}
          </div>
        </div>
        <div className="border-border/60 bg-card/60 rounded-xl border p-4">
          <div className="text-foreground text-2xl font-bold tabular-nums">
            {formatCount(jobs.offers)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {t("jobs.offers")}
          </div>
        </div>
        <div className="border-border/60 bg-card/60 rounded-xl border p-4">
          <div className="text-foreground text-2xl font-bold tabular-nums">
            {formatCount(jobs.hired)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {t("jobs.hired")}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-muted-foreground mb-2 text-sm">
          {t("jobs.statusDistribution", { count: jobs.totalApplications })}
        </div>
        <JobStatusBar jobs={jobs} t={t} />
      </div>

      <div className="mt-6">
        <UpcomingEventsBox events={upcomingEvents} format={format} t={t} />
      </div>
    </div>
  );
}

function JobStatusBar({
  jobs,
  t,
}: {
  jobs: AdminOverviewData["jobs"];
  t: DashboardTranslation;
}) {
  const total = jobs.totalApplications;

  const ariaDescription = `${jobs.applied} ${t("jobs.applied")}, ${jobs.ghosted} ${t("jobs.ghosted")}, ${jobs.rejected} ${t("jobs.rejected")}`;

  return (
    <div>
      <div
        className="bg-muted/50 flex h-2.5 gap-1 overflow-hidden rounded-full"
        role="img"
        aria-label={ariaDescription}
      >
        {total === 0 ? (
          <div className="bg-muted/60 h-full w-full rounded-full" />
        ) : (
          <>
            {jobs.applied > 0 ? (
              <span
                className="bg-primary rounded-full transition-all duration-300"
                style={{ flex: jobs.applied }}
              />
            ) : null}
            {jobs.inProgress > 0 ? (
              <span
                className="rounded-full bg-sky-500 transition-all duration-300"
                style={{ flex: jobs.inProgress }}
              />
            ) : null}
            {jobs.offers > 0 ? (
              <span
                className="rounded-full bg-amber-500 transition-all duration-300"
                style={{ flex: jobs.offers }}
              />
            ) : null}
            {jobs.hired > 0 ? (
              <span
                className="rounded-full bg-emerald-500 transition-all duration-300"
                style={{ flex: jobs.hired }}
              />
            ) : null}
            {jobs.ghosted > 0 ? (
              <span
                className="bg-muted-foreground/60 rounded-full transition-all duration-300"
                style={{ flex: jobs.ghosted }}
              />
            ) : null}
            {jobs.rejected > 0 ? (
              <span
                className="rounded-full bg-rose-500/80 transition-all duration-300"
                style={{ flex: jobs.rejected }}
              />
            ) : null}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        <span className="flex items-center gap-2">
          <span aria-hidden className="bg-primary size-2 rounded-full" />
          <span className="text-muted-foreground">{t("jobs.applied")}</span>
          <b className="text-foreground font-semibold tabular-nums">
            {jobs.applied}
          </b>
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-muted-foreground/60 size-2 rounded-full"
          />
          <span className="text-muted-foreground">{t("jobs.ghosted")}</span>
          <b className="text-foreground font-semibold tabular-nums">
            {jobs.ghosted}
          </b>
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full bg-rose-500/80" />
          <span className="text-muted-foreground">{t("jobs.rejected")}</span>
          <b className="text-foreground font-semibold tabular-nums">
            {jobs.rejected}
          </b>
        </span>
        {jobs.inProgress > 0 ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-sky-500" />
            <span className="text-muted-foreground">
              {t("jobs.inProgress")}
            </span>
            <b className="text-foreground font-semibold tabular-nums">
              {jobs.inProgress}
            </b>
          </span>
        ) : null}
        {jobs.offers > 0 ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{t("jobs.offers")}</span>
            <b className="text-foreground font-semibold tabular-nums">
              {jobs.offers}
            </b>
          </span>
        ) : null}
        {jobs.hired > 0 ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{t("jobs.hired")}</span>
            <b className="text-foreground font-semibold tabular-nums">
              {jobs.hired}
            </b>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function UpcomingEventsBox({
  events,
  format,
  t,
}: {
  events: UpcomingEventDTO[];
  format: ReturnType<typeof useFormatter>;
  t: DashboardTranslation;
}) {
  if (events.length === 0) {
    return (
      <div className="border-border/80 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4">
        <div>
          <div className="text-foreground text-sm font-medium">
            {t("jobs.noUpcomingEvents")}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {t("jobs.noUpcomingHint")}
          </div>
        </div>
        <Link
          href="/admin/job-tracker"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Plus className="mr-1.5 size-3.5" aria-hidden />
          <span>{t("jobs.addEvent")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="border-border/60 bg-card/30 rounded-xl border p-4">
      <div className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        {t("jobs.upcoming")}
      </div>
      <ul className="divide-border/60 divide-y">
        {events.map((event) => (
          <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
            <Link
              href={{
                pathname: "/admin/job-tracker/applications/[id]",
                params: { id: event.application.id },
              }}
              className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {event.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {event.application.company.name} ·{" "}
                  {event.application.position}
                </p>
              </div>
              <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
                <Calendar className="size-3.5" aria-hidden />
                <span>
                  {format.dateTime(event.scheduledDate, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReferrersCard({
  referrers,
  t,
}: {
  referrers: AdminOverviewData["traffic"]["referrers"];
  t: DashboardTranslation;
}) {
  return (
    <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
      <h2 className="text-foreground text-xl font-semibold">
        {t("traffic.referrersTitle")}
      </h2>
      <p className="text-muted-foreground mt-1 mb-5 text-sm">
        {t("traffic.referrersHint")}
      </p>

      <RankList
        emptyLabel={t("traffic.emptyReferrers")}
        items={referrers.map((item) => ({
          key: item.key,
          pageviews: item.pageviews,
          label: item.key,
        }))}
        limit={5}
        showAllLabel={t("traffic.showAll", { count: referrers.length })}
        showLessLabel={t("traffic.showLess")}
      />
    </div>
  );
}

function ServicesCard({
  onToggle,
  services,
  t,
}: {
  onToggle: (id: string, active: boolean) => void;
  services: DashboardServiceRow[];
  t: DashboardTranslation;
}) {
  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("services.subtitle")}{" "}
            <span className="text-foreground font-medium">
              {t("services.visibleCount", {
                active: activeCount,
                total: services.length,
              })}
            </span>
          </p>
        </div>
        <Link
          href="/admin/services"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <span>{t("manage")}</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          {t("services.empty")}
        </p>
      ) : (
        <ul className="divide-border/60 mt-4 divide-y">
          {services.map((service) => (
            <ServiceRowItem
              key={service.id}
              service={service}
              onToggle={onToggle}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ServiceRowItem({
  onToggle,
  service,
  t,
}: {
  onToggle: (id: string, active: boolean) => void;
  service: DashboardServiceRow;
  t: DashboardTranslation;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-foreground truncate text-sm font-medium">
          {service.title}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          <span>{service.type}</span>
          {service.featured ? (
            <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider uppercase">
              {t("services.featured")}
            </span>
          ) : null}
        </div>
      </div>
      <Switch
        checked={service.isActive}
        onCheckedChange={(checked) => onToggle(service.id, checked)}
        aria-label={t("services.toggleVisibilityAria", {
          title: service.title,
        })}
      />
    </li>
  );
}

function ContentInventoryCard({
  format,
  inventory,
  t,
}: {
  format: ReturnType<typeof useFormatter>;
  inventory: AdminOverviewData["inventory"];
  t: DashboardTranslation;
}) {
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  const items = [
    {
      href: "/admin/certifications" as const,
      count: inventory.certifications,
      title: t("stats.certificates.title"),
      icon: Award,
    },
    {
      href: "/admin/projects" as const,
      count: inventory.projects,
      title: t("stats.projects.title"),
      icon: Briefcase,
    },
    {
      href: "/admin/skills" as const,
      count: inventory.skills,
      title: t("stats.skills.title"),
      icon: Code2,
    },
  ];

  return (
    <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-5 shadow-sm backdrop-blur sm:p-6">
      <h2 className="text-foreground text-xl font-semibold">
        {t("inventory.title")}
      </h2>
      <p className="text-muted-foreground mt-1 mb-5 text-sm">
        {t("inventory.subtitle")}
      </p>

      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="border-border/60 bg-card/60 hover:bg-accent/40 hover:border-border focus-visible:ring-primary/40 flex items-center justify-between rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {item.title}
                  </span>
                </div>
                <b className="text-foreground text-2xl font-bold tabular-nums">
                  {formatCount(item.count)}
                </b>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
