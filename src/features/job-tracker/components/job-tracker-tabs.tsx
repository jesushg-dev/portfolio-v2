"use client";

import { useState, type FC } from "react";
import { Building2, Kanban, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { ApplicationsKanban } from "@/features/job-tracker/components/applications-kanban";
import { CompaniesList } from "@/features/job-tracker/components/companies-list";
import type { RouterOutputs } from "@/trpc/react";
import { cn } from "@/lib/utils";

type ApplicationRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];
type CompanyRow =
  RouterOutputs["jobTrackerAdmin"]["getCompanies"]["data"][number];

type JobTrackerTab = "applications" | "companies";

interface JobTrackerTabsProps {
  initialApplications: ApplicationRow[];
  applicationsTotalCount: number;
  initialCompanies: CompanyRow[];
  companiesPageCount: number;
  companiesTotalCount: number;
}

const TAB_CONFIG: {
  id: JobTrackerTab;
  icon: LucideIcon;
  labelKey: "applicationsTab" | "companiesTab";
}[] = [
  { id: "applications", icon: Kanban, labelKey: "applicationsTab" },
  { id: "companies", icon: Building2, labelKey: "companiesTab" },
];

export const JobTrackerTabs: FC<JobTrackerTabsProps> = ({
  initialApplications,
  applicationsTotalCount,
  initialCompanies,
  companiesPageCount,
  companiesTotalCount,
}) => {
  const t = useTranslations("admin.jobTracker");
  const [activeTab, setActiveTab] = useState<JobTrackerTab>("applications");

  return (
    <div className="border-border bg-card flex min-h-[560px] flex-col overflow-hidden rounded-xl border shadow-sm">
      <nav
        aria-label={t("tabsNavAria")}
        className="bg-muted/30 flex shrink-0 overflow-x-auto"
        role="tablist"
      >
        {TAB_CONFIG.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 p-6" role="tabpanel">
        {activeTab === "applications" ? (
          <ApplicationsKanban
            initialApplications={initialApplications}
            totalCount={applicationsTotalCount}
          />
        ) : (
          <CompaniesList
            initialCompanies={initialCompanies}
            pageCount={companiesPageCount}
            totalCount={companiesTotalCount}
          />
        )}
      </div>
    </div>
  );
};
