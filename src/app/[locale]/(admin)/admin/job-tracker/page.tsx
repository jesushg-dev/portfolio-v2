import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardStats } from "@/features/job-tracker/components/dashboard-stats";
import { UpcomingEventsCalendar } from "@/features/job-tracker/components/upcoming-events-calendar";
import { JobTrackerTabs } from "@/features/job-tracker/components/job-tracker-tabs";
import {
  getJobTrackerPageData,
  getCompaniesListData,
} from "@/features/job-tracker/server/job-tracker-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const JobTrackerPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as Locale);

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 10;
  const companiesPage =
    typeof search.companiesPage === "string"
      ? parseInt(search.companiesPage) || 1
      : 1;
  const companiesPerPage =
    typeof search.companiesPerPage === "string"
      ? parseInt(search.companiesPerPage) || 10
      : 10;

  const [t, pageData, companiesData] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getJobTrackerPageData({
      page,
      perPage,
      sort: [],
      filters: [],
    }),
    getCompaniesListData({
      page: companiesPage,
      perPage: companiesPerPage,
      sort: [],
      filters: [],
    }),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("pageDescription")}
        </p>
      </div>

      <DashboardStats initialStats={pageData.stats} />

      <UpcomingEventsCalendar
        initialEvents={pageData.upcomingEvents}
        locale={locale as Locale}
      />

      <div className="min-h-0 flex-1">
        <JobTrackerTabs
          locale={locale as Locale}
          initialApplications={pageData.applications.data}
          applicationsPageCount={pageData.applications.pageCount}
          applicationsTotalCount={pageData.applications.totalCount}
          initialCompanies={companiesData.data}
          companiesPageCount={companiesData.pageCount}
          companiesTotalCount={companiesData.totalCount}
        />
      </div>
    </div>
  );
};

export default JobTrackerPage;
