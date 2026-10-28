"use client";

import { useMemo, useState, type FC } from "react";
import { isThisWeek } from "date-fns";
import {
  Building2,
  Calendar,
  Kanban,
  MailCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ApplicationsKanban } from "@/features/job-tracker/components/applications-kanban";
import { CompaniesList } from "@/features/job-tracker/components/companies-list";
import { OutreachHub } from "@/features/job-tracker/components/outreach-hub";
import { TodayDashboard } from "@/features/job-tracker/components/today-dashboard";
import { UpcomingEventsAlertBanner } from "@/features/job-tracker/components/upcoming-events-alert-banner";
import { UpcomingEventsCalendar } from "@/features/job-tracker/components/upcoming-events-calendar";
import {
  getPendingFollowUps,
  getSuggestedClosures,
} from "@/features/job-tracker/lib/today-dashboard-helpers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type RouterOutputs } from "@/trpc/react";
import type { Locale } from "@/i18n/config";
import type { UpcomingEvent } from "@/features/job-tracker/types";
import { cn } from "@/lib/utils";

type ApplicationRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];
type CompanyRow =
  RouterOutputs["jobTrackerAdmin"]["getCompanies"]["data"][number];

type JobTrackerTab =
  "today" | "applications" | "events" | "companies" | "outreach";

interface JobTrackerTabsProps {
  initialApplications: ApplicationRow[];
  applicationsTotalCount: number;
  initialCompanies: CompanyRow[];
  companiesPageCount: number;
  companiesTotalCount: number;
  initialUpcomingEvents: UpcomingEvent[];
  locale: Locale;
}

const TAB_CONFIG: {
  id: JobTrackerTab;
  icon: LucideIcon;
  labelKey:
    | "todayTab"
    | "applicationsTab"
    | "eventsTab"
    | "companiesTab"
    | "outreachTab";
}[] = [
  { id: "today", icon: Sparkles, labelKey: "todayTab" },
  { id: "applications", icon: Kanban, labelKey: "applicationsTab" },
  { id: "events", icon: Calendar, labelKey: "eventsTab" },
  { id: "outreach", icon: MailCheck, labelKey: "outreachTab" },
  { id: "companies", icon: Building2, labelKey: "companiesTab" },
];

export const JobTrackerTabs: FC<JobTrackerTabsProps> = ({
  initialApplications,
  applicationsTotalCount,
  initialCompanies,
  companiesPageCount,
  companiesTotalCount,
  initialUpcomingEvents,
  locale,
}) => {
  const t = useTranslations("admin.jobTracker");
  const [activeTab, setActiveTab] = useState<JobTrackerTab>("today");

  const { data: stats } = api.jobTrackerAdmin.getDashboardStats.useQuery(
    undefined,
    {
      placeholderData: {
        totalApplications: applicationsTotalCount,
        totalCompanies: companiesTotalCount,
        applied: 0,
        inProgress: 0,
        offers: 0,
        ghosted: 0,
        rejected: 0,
        hired: 0,
      },
    },
  );

  const { data: upcomingEvents = initialUpcomingEvents } =
    api.jobTrackerAdmin.getUpcomingEvents.useQuery(
      { limit: 20 },
      { placeholderData: initialUpcomingEvents },
    );

  const { data: outreachData } =
    api.jobTrackerAdmin.getEmailTrackingHub.useQuery(undefined, {
      select: (res) => ({
        totalSent: res.stats.totalSent,
        recentOpens24h: res.stats.recentOpens24h,
      }),
    });

  const weekEventsCount = useMemo(() => {
    return upcomingEvents.filter((event) =>
      isThisWeek(new Date(event.scheduledDate), { weekStartsOn: 1 }),
    ).length;
  }, [upcomingEvents]);

  const pendingFollowUpsCount = useMemo(
    () => getPendingFollowUps(initialApplications).length,
    [initialApplications],
  );
  const suggestedClosuresCount = useMemo(
    () => getSuggestedClosures(initialApplications).length,
    [initialApplications],
  );
  const todayUrgentCount = pendingFollowUpsCount + suggestedClosuresCount;

  const applicationsCount = stats?.totalApplications ?? applicationsTotalCount;
  const companiesCount = stats?.totalCompanies ?? companiesTotalCount;
  const outreachCount = outreachData?.totalSent ?? 0;
  const eventsCount = upcomingEvents.length;

  const getCount = (tabId: JobTrackerTab) => {
    switch (tabId) {
      case "today":
        return todayUrgentCount;
      case "applications":
        return applicationsCount;
      case "events":
        return eventsCount;
      case "companies":
        return companiesCount;
      case "outreach":
        return outreachCount;
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as JobTrackerTab)}
      className={cn(
        "border-border bg-card flex flex-col rounded-xl border shadow-sm",
        activeTab === "applications"
          ? "sticky top-0 z-20 h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden md:top-16 md:h-[calc(100dvh-4rem)]"
          : "min-h-0",
      )}
    >
      <div className="border-border bg-muted/30 border-b px-3">
        <TabsList
          variant="line"
          aria-label={t("tabsNavAria")}
          className="flex h-12 w-fit [scrollbar-width:none] justify-start gap-1 overflow-x-auto overflow-y-hidden p-0 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {TAB_CONFIG.map(({ id, icon: Icon, labelKey }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="h-full flex-initial shrink-0 gap-2 px-4 text-sm font-medium"
            >
              <Icon className="size-4" aria-hidden />
              <span>{t(labelKey)}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                  id === "today" && todayUrgentCount > 0
                    ? "border-warning/30 bg-warning/10 text-warning border font-bold"
                    : "bg-muted/80 text-foreground",
                )}
              >
                {getCount(id)}
              </span>
              {id === "events" && weekEventsCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="border-primary/25 bg-primary/10 text-primary ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                >
                  {t("eventsThisWeekBadge", { count: weekEventsCount })}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <UpcomingEventsAlertBanner
        events={upcomingEvents}
        locale={locale}
        onViewAgenda={() => setActiveTab("events")}
        className="mx-3 mt-3 sm:mx-4 sm:mt-4"
      />

      <TabsContent value="today" className="p-2.5 sm:p-4 md:p-6">
        <TodayDashboard
          applications={initialApplications}
          upcomingEvents={upcomingEvents}
          stats={stats}
          outreachData={outreachData}
          locale={locale}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      </TabsContent>

      <TabsContent
        value="applications"
        className="min-h-0 flex-1 overflow-hidden p-2.5 sm:p-4 md:p-6"
      >
        <ApplicationsKanban
          initialApplications={initialApplications}
          totalCount={applicationsTotalCount}
        />
      </TabsContent>

      <TabsContent value="events" className="p-2.5 sm:p-4 md:p-6">
        <UpcomingEventsCalendar
          initialEvents={upcomingEvents}
          locale={locale}
        />
      </TabsContent>

      <TabsContent value="outreach" className="p-2.5 sm:p-4 md:p-6">
        <OutreachHub />
      </TabsContent>

      <TabsContent value="companies" className="p-2.5 sm:p-4 md:p-6">
        <CompaniesList
          initialCompanies={initialCompanies}
          pageCount={companiesPageCount}
          totalCount={companiesTotalCount}
        />
      </TabsContent>
    </Tabs>
  );
};
