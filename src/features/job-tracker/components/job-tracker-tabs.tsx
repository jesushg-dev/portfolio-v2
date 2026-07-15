"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsList } from "@/features/job-tracker/components/applications-list";
import { CompaniesList } from "@/features/job-tracker/components/companies-list";
import type { Locale } from "@/i18n/config";
import type { RouterOutputs } from "@/trpc/react";

type ApplicationRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];
type CompanyRow =
  RouterOutputs["jobTrackerAdmin"]["getCompanies"]["data"][number];

interface JobTrackerTabsProps {
  locale: Locale;
  initialApplications: ApplicationRow[];
  applicationsPageCount: number;
  applicationsTotalCount: number;
  initialCompanies: CompanyRow[];
  companiesPageCount: number;
  companiesTotalCount: number;
}

export const JobTrackerTabs: FC<JobTrackerTabsProps> = ({
  locale,
  initialApplications,
  applicationsPageCount,
  applicationsTotalCount,
  initialCompanies,
  companiesPageCount,
  companiesTotalCount,
}) => {
  const t = useTranslations("admin.jobTracker");

  return (
    <Tabs defaultValue="applications" className="space-y-4">
      <TabsList>
        <TabsTrigger value="applications">{t("applicationsTab")}</TabsTrigger>
        <TabsTrigger value="companies">{t("companiesTab")}</TabsTrigger>
      </TabsList>

      <TabsContent value="applications" className="min-h-0 flex-1 space-y-4">
        <ApplicationsList
          initialApplications={initialApplications}
          locale={locale}
          pageCount={applicationsPageCount}
          totalCount={applicationsTotalCount}
        />
      </TabsContent>

      <TabsContent value="companies" className="min-h-0 flex-1 space-y-4">
        <CompaniesList
          initialCompanies={initialCompanies}
          pageCount={companiesPageCount}
          totalCount={companiesTotalCount}
        />
      </TabsContent>
    </Tabs>
  );
};
