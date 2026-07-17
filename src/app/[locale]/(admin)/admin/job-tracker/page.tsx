import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, Plus } from "lucide-react";

import { DashboardStats } from "@/features/job-tracker/components/dashboard-stats";
import { UpcomingEventsCalendar } from "@/features/job-tracker/components/upcoming-events-calendar";
import { JobTrackerTabs } from "@/features/job-tracker/components/job-tracker-tabs";
import {
  getJobTrackerPageData,
  getCompaniesListData,
} from "@/features/job-tracker/server/job-tracker-queries";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const JobTrackerPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as Locale);

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 100;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            {t("pageDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/job-tracker/applications/new"
            className={buttonVariants()}
          >
            <Plus className="mr-1.5 size-4" aria-hidden />
            {t("newApplication")}
          </Link>
          <Link
            href="/admin/job-tracker/companies/new"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Building2 className="mr-1.5 size-4" aria-hidden />
            {t("newCompany")}
          </Link>
        </div>
      </div>

      <DashboardStats initialStats={pageData.stats} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <JobTrackerTabs
          initialApplications={pageData.applications.data}
          applicationsTotalCount={pageData.applications.totalCount}
          initialCompanies={companiesData.data}
          companiesPageCount={companiesData.pageCount}
          companiesTotalCount={companiesData.totalCount}
        />

        <UpcomingEventsCalendar
          initialEvents={pageData.upcomingEvents}
          locale={locale as Locale}
          variant="sidebar"
        />
      </div>
    </div>
  );
};

export default JobTrackerPage;
