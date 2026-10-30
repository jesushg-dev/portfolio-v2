export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Building2, Plus } from "lucide-react";

import { JobTrackerTabs } from "@/features/job-tracker/components/job-tracker-tabs";
import { StartJobSearchButton } from "@/features/job-tracker/components/start-job-search-button";
import {
  getJobTrackerPageData,
  getCompaniesListData,
} from "@/features/job-tracker/server/job-tracker-queries";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const JobTrackerPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

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
    <div className="w-full max-w-full min-w-0">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              {t("pageDescription")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/job-tracker/companies/new"
              className={buttonVariants({ variant: "outline" })}
            >
              <Building2 className="mr-1.5 size-4" aria-hidden />
              {t("newCompany")}
            </Link>
            <Link
              href="/admin/job-tracker/applications/new"
              className={buttonVariants()}
            >
              <Plus className="mr-1.5 size-4" aria-hidden />
              {t("newApplication")}
            </Link>
          </div>
        </div>
      </div>

      {!pageData.hasOpenSearch ? (
        <div className="border-primary/20 bg-primary/5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <p className="text-sm">{t("search.noActive")}</p>
          <StartJobSearchButton />
        </div>
      ) : null}

      <JobTrackerTabs
        initialApplications={pageData.applications.data}
        applicationsTotalCount={pageData.applications.totalCount}
        initialCompanies={companiesData.data}
        companiesPageCount={companiesData.pageCount}
        companiesTotalCount={companiesData.totalCount}
        initialUpcomingEvents={pageData.upcomingEvents}
        locale={locale as Locale}
      />
    </div>
  );
};

export default JobTrackerPage;
