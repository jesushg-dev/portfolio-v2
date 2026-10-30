"use client";

import { useMemo, useState, useTransition, type FC } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Lightbulb,
  MailCheck,
  Send,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFunnelMetrics,
  getPendingFollowUps,
  getSuggestedClosures,
  getWeeklyTimeline,
  type ConversionFunnelMetrics,
  type PendingFollowUpItem,
  type SuggestedClosureItem,
  type WeeklyTimelineDay,
} from "@/features/job-tracker/lib/today-dashboard-helpers";
import type {
  ApplicationListRow,
  ApplicationStatus,
  DashboardStats,
  UpcomingEvent,
} from "@/features/job-tracker/types";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/react";

interface TodayDashboardProps {
  applications: ApplicationListRow[];
  upcomingEvents: UpcomingEvent[];
  stats?: DashboardStats;
  outreachData?: {
    totalSent: number;
    recentOpens24h: number;
    totalOpens?: number;
    openRate?: number;
  };
  locale: Locale;
  onNavigateTab: (
    tab: "applications" | "events" | "outreach" | "companies",
  ) => void;
}

export const TodayDashboard: FC<TodayDashboardProps> = ({
  applications,
  upcomingEvents,
  stats,
  outreachData,
  locale,
  onNavigateTab,
}) => {
  const t = useTranslations("admin.jobTracker");
  const utils = api.useUtils();
  const [, startTransition] = useTransition();
  const [showAllClosures, setShowAllClosures] = useState(false);

  const pendingFollowUps = useMemo(
    () => getPendingFollowUps(applications),
    [applications],
  );

  const suggestedClosures = useMemo(
    () => getSuggestedClosures(applications),
    [applications],
  );

  const weeklyDays = useMemo(
    () => getWeeklyTimeline(upcomingEvents, applications),
    [upcomingEvents, applications],
  );

  const funnel = useMemo(
    () => getFunnelMetrics(applications, stats),
    [applications, stats],
  );

  const snoozeMutation = api.jobTrackerAdmin.snoozeGhostNudge.useMutation({
    onSuccess: () => {
      void utils.jobTrackerAdmin.getApplications.invalidate();
      void utils.jobTrackerAdmin.getDashboardStats.invalidate();
    },
  });

  const updateStatusMutation =
    api.jobTrackerAdmin.updateApplicationStatus.useMutation({
      onSuccess: () => {
        void utils.jobTrackerAdmin.getApplications.invalidate();
        void utils.jobTrackerAdmin.getDashboardStats.invalidate();
      },
    });

  const handleSnooze = (applicationId: string, days: number) => {
    startTransition(async () => {
      try {
        await snoozeMutation.mutateAsync({ ids: [applicationId], days });
        toast.success(t("today.toastSnoozed", { days }));
      } catch {
        toast.error("Error");
      }
    });
  };

  const handleStatusChange = (
    applicationId: string,
    newStatus: ApplicationStatus,
  ) => {
    startTransition(async () => {
      try {
        await updateStatusMutation.mutateAsync({
          id: applicationId,
          status: newStatus,
        });
        toast.success(
          t("today.toastStatusUpdated", {
            status: t(`status.${newStatus}`),
          }),
        );
      } catch {
        toast.error("Error");
      }
    });
  };

  const visibleClosures = showAllClosures
    ? suggestedClosures
    : suggestedClosures.slice(0, 3);

  return (
    <div className="space-y-4">
      <TodayHero
        dueCount={pendingFollowUps.length}
        closeCount={suggestedClosures.length}
        locale={locale}
        t={t}
      />

      <TodayKpiStrip
        totalApplications={funnel.total}
        interviewsCount={funnel.interviews}
        responseRate={funnel.respondedRate}
        dueCount={pendingFollowUps.length}
        closeCount={suggestedClosures.length}
        t={t}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <TodayFollowUpsList
            items={pendingFollowUps}
            onSnooze={handleSnooze}
            onStatusChange={handleStatusChange}
            t={t}
          />

          <TodayClosuresList
            items={visibleClosures}
            totalCount={suggestedClosures.length}
            showAll={showAllClosures}
            onToggleShowAll={() => setShowAllClosures((prev) => !prev)}
            onSnooze={handleSnooze}
            onStatusChange={handleStatusChange}
            t={t}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <TodayWeeklyTimeline
            days={weeklyDays}
            dueCount={pendingFollowUps.length}
            locale={locale}
            t={t}
          />

          <TodayFunnel funnel={funnel} t={t} />

          <TodayOutreachCard
            outreachData={outreachData}
            onNavigateOutreach={() => onNavigateTab("outreach")}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

interface TodayHeroProps {
  dueCount: number;
  closeCount: number;
  locale: Locale;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayHero({ dueCount, closeCount, locale, t }: TodayHeroProps) {
  const now = new Date();
  const rawDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const hasUrgent = dueCount > 0 || closeCount > 0;

  return (
    <div className="border-border bg-card text-card-foreground flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:p-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-5" aria-hidden />
          <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
            {formattedDate}
          </h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {hasUrgent
            ? t("today.dateSubtitleUrgent", { dueCount, closeCount })
            : t("today.dateSubtitleClean")}
        </p>
      </div>

      {hasUrgent ? (
        <Badge
          variant="secondary"
          className="border-warning/30 bg-warning/10 text-warning rounded-full border px-3 py-1 text-xs font-semibold"
        >
          <Clock className="mr-1.5 size-3.5" aria-hidden />
          {t("today.kpiPendingFollowUps")}: {dueCount + closeCount}
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="border-success/30 bg-success/10 text-success rounded-full border px-3 py-1 text-xs font-semibold"
        >
          <CheckCircle2 className="mr-1.5 size-3.5" aria-hidden />
          {t("today.pendingFollowUpsEmpty")}
        </Badge>
      )}
    </div>
  );
}

interface TodayKpiStripProps {
  totalApplications: number;
  interviewsCount: number;
  responseRate: number;
  dueCount: number;
  closeCount: number;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayKpiStrip({
  totalApplications,
  interviewsCount,
  responseRate,
  dueCount,
  closeCount,
  t,
}: TodayKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
      <div className="border-border bg-card text-card-foreground rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {t("today.kpiTotal")}
          </span>
          <Briefcase className="text-muted-foreground size-4" aria-hidden />
        </div>
        <p className="text-foreground mt-2 text-2xl font-bold">
          {totalApplications}
        </p>
      </div>

      <div className="border-border bg-card text-card-foreground rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {t("today.kpiInterviews")}
          </span>
          <Calendar className="text-primary size-4" aria-hidden />
        </div>
        <p className="text-foreground mt-2 text-2xl font-bold">
          {interviewsCount}
        </p>
      </div>

      <div className="border-border bg-card text-card-foreground rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {t("today.kpiResponseRate")}
          </span>
          <TrendingUp className="text-success size-4" aria-hidden />
        </div>
        <p className="text-foreground mt-2 text-2xl font-bold">
          {responseRate}%
        </p>
      </div>

      <div className="border-border bg-card text-card-foreground rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {t("today.kpiPendingFollowUps")}
          </span>
          <Clock
            className={`size-4 ${dueCount > 0 ? "text-warning" : "text-muted-foreground"}`}
            aria-hidden
          />
        </div>
        <p
          className={`mt-2 text-2xl font-bold ${dueCount > 0 ? "text-warning" : "text-foreground"}`}
        >
          {dueCount}
        </p>
      </div>

      <div className="border-border bg-card text-card-foreground rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {t("today.kpiSuggestedClosures")}
          </span>
          <AlertCircle
            className={`size-4 ${closeCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
            aria-hidden
          />
        </div>
        <p
          className={`mt-2 text-2xl font-bold ${closeCount > 0 ? "text-destructive" : "text-foreground"}`}
        >
          {closeCount}
        </p>
      </div>
    </div>
  );
}

interface TodayFollowUpsListProps {
  items: PendingFollowUpItem[];
  onSnooze: (id: string, days: number) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayFollowUpsList({
  items,
  onSnooze,
  onStatusChange,
  t,
}: TodayFollowUpsListProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold sm:text-lg">
              {t("today.pendingFollowUpsTitle")}
            </CardTitle>
            <Badge
              variant={items.length > 0 ? "secondary" : "outline"}
              className={
                items.length > 0
                  ? "border-warning/30 bg-warning/10 text-warning rounded-full border px-2 py-0.5 text-xs font-bold"
                  : "rounded-full"
              }
            >
              {items.length}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {t("today.pendingFollowUpsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="border-border/60 flex items-center gap-3 rounded-lg border border-dashed p-4">
            <CheckCircle2 className="text-success size-5 shrink-0" />
            <p className="text-muted-foreground text-sm font-medium">
              {t("today.pendingFollowUpsEmpty")}
            </p>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <TodayFollowUpRow
                key={item.application.id}
                item={item}
                onSnooze={onSnooze}
                onStatusChange={onStatusChange}
                t={t}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface TodayFollowUpRowProps {
  item: PendingFollowUpItem;
  onSnooze: (id: string, days: number) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayFollowUpRow({
  item,
  onSnooze,
  onStatusChange,
  t,
}: TodayFollowUpRowProps) {
  const { application, calendarDaysElapsed, isUrgent, lastEmailDaysAgo } = item;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={{
              pathname: "/admin/job-tracker/applications/[id]",
              params: { id: application.id },
            }}
            className="text-foreground hover:text-primary font-semibold hover:underline"
          >
            {application.position}
          </Link>
          <Badge
            variant="outline"
            className={
              isUrgent
                ? "border-destructive/30 bg-destructive/10 text-destructive text-xs"
                : "border-warning/30 bg-warning/10 text-warning text-xs"
            }
          >
            {isUrgent ? t("today.chipLastAttempt") : t("today.chipFollowUpDue")}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {application.company.name} ·{" "}
          {t("today.appliedDaysAgo", { days: calendarDaysElapsed })} ·{" "}
          {lastEmailDaysAgo !== null
            ? t("today.lastEmailDaysAgo", { days: lastEmailDaysAgo })
            : t("today.noEmailRegistered")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Link
          href={{
            pathname: "/admin/job-tracker/applications/[id]",
            params: { id: application.id },
          }}
          className={buttonVariants({ size: "sm" })}
        >
          <Send className="mr-1 size-3.5" aria-hidden />
          <span>{t("today.btnSendFollowUp")}</span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSnooze(application.id, 3)}
        >
          {t("today.btnSnooze3Days")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStatusChange(application.id, "GHOSTED")}
        >
          {t("today.btnMarkGhosted")}
        </Button>
      </div>
    </li>
  );
}

interface TodayClosuresListProps {
  items: SuggestedClosureItem[];
  totalCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  onSnooze: (id: string, days: number) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayClosuresList({
  items,
  totalCount,
  showAll,
  onToggleShowAll,
  onSnooze,
  onStatusChange,
  t,
}: TodayClosuresListProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold sm:text-lg">
              {t("today.suggestedClosuresTitle")}
            </CardTitle>
            <Badge
              variant={totalCount > 0 ? "secondary" : "outline"}
              className={
                totalCount > 0
                  ? "border-destructive/30 bg-destructive/10 text-destructive rounded-full border px-2 py-0.5 text-xs font-bold"
                  : "rounded-full"
              }
            >
              {totalCount}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {t("today.suggestedClosuresDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {totalCount === 0 ? (
          <div className="border-border/60 flex items-center gap-3 rounded-lg border border-dashed p-4">
            <CheckCircle2 className="text-success size-5 shrink-0" />
            <p className="text-muted-foreground text-sm font-medium">
              {t("today.suggestedClosuresEmpty")}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-border divide-y">
              {items.map((item) => (
                <TodayClosureRow
                  key={item.application.id}
                  item={item}
                  onSnooze={onSnooze}
                  onStatusChange={onStatusChange}
                  t={t}
                />
              ))}
            </ul>
            {totalCount > 3 ? (
              <div className="border-border mt-3 border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleShowAll}
                  className="w-full text-xs"
                >
                  {showAll
                    ? t("today.btnShowLessClosures")
                    : t("today.btnShowMoreClosures", {
                        count: totalCount - 3,
                      })}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface TodayClosureRowProps {
  item: SuggestedClosureItem;
  onSnooze: (id: string, days: number) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayClosureRow({
  item,
  onSnooze,
  onStatusChange,
  t,
}: TodayClosureRowProps) {
  const { application, calendarDaysElapsed } = item;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-48 flex-1">
        <Link
          href={{
            pathname: "/admin/job-tracker/applications/[id]",
            params: { id: application.id },
          }}
          className="text-foreground hover:text-primary font-semibold hover:underline"
        >
          {application.position}
        </Link>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {application.company.name} ·{" "}
          {t("today.ghostedDaysAgo", { days: calendarDaysElapsed })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange(application.id, "REJECTED")}
        >
          {t("today.btnCloseProcess")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSnooze(application.id, 7)}
        >
          {t("today.btnSnooze7Days")}
        </Button>
      </div>
    </li>
  );
}

interface TodayWeeklyTimelineProps {
  days: WeeklyTimelineDay[];
  dueCount: number;
  locale: Locale;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayWeeklyTimeline({
  days,
  dueCount,
  locale,
  t,
}: TodayWeeklyTimelineProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold sm:text-lg">
          {t("today.weeklyTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("today.weeklyDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-border divide-y text-xs">
          {days.map((day, idx) => {
            const dayLabel = day.isToday
              ? t("today.dayToday")
              : day.isTomorrow
                ? t("today.dayTomorrow")
                : new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    day: "numeric",
                  }).format(day.date);

            const hasItems =
              day.events.length > 0 ||
              day.projectedFollowUps.length > 0 ||
              (day.isToday && dueCount > 0);

            return (
              <li
                key={day.date.toISOString()}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={`w-20 shrink-0 font-semibold ${
                    idx === 0
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {dayLabel}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  {!hasItems ? (
                    <span className="text-muted-foreground">
                      {t("today.dayFree")}
                    </span>
                  ) : (
                    <>
                      {day.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-center gap-1.5 font-medium"
                        >
                          {evt.isVirtual ? (
                            <Video className="text-primary size-3 shrink-0" />
                          ) : (
                            <Calendar className="text-muted-foreground size-3 shrink-0" />
                          )}
                          <span className="truncate">
                            {new Intl.DateTimeFormat(locale, {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(evt.scheduledDate))}{" "}
                            {evt.title}
                            {evt.application?.company?.name
                              ? ` · ${evt.application.company.name}`
                              : ""}
                          </span>
                        </div>
                      ))}

                      {day.isToday && dueCount > 0 ? (
                        <div className="text-warning font-medium">
                          {t("today.dayPendingFollowUpsCount", {
                            count: dueCount,
                          })}
                        </div>
                      ) : null}

                      {idx > 0 && day.projectedFollowUps.length > 0
                        ? day.projectedFollowUps.map((app) => (
                            <div
                              key={app.id}
                              className="text-muted-foreground truncate"
                            >
                              {t("today.dayFollowUpDue", {
                                company: app.company.name,
                              })}
                            </div>
                          ))
                        : null}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

interface TodayFunnelProps {
  funnel: ConversionFunnelMetrics;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayFunnel({ funnel, t }: TodayFunnelProps) {
  const steps = [
    {
      label: t("today.funnelStepApplied"),
      count: funnel.total,
      rate: 100,
    },
    {
      label: t("today.funnelStepResponded"),
      count: funnel.responded,
      rate: funnel.respondedRate,
    },
    {
      label: t("today.funnelStepInterviews"),
      count: funnel.interviews,
      rate: funnel.interviewRate,
    },
    {
      label: t("today.funnelStepOffers"),
      count: funnel.offers,
      rate: funnel.offerRate,
    },
  ];

  const coachingTip =
    funnel.interviews === 0
      ? t("today.funnelTipNoInterviews")
      : funnel.offers > 0
        ? t("today.funnelTipHasOffers")
        : t("today.funnelTipActiveInterviews");

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold sm:text-lg">
          {t("today.funnelTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("today.funnelDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {steps.map((step) => (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{step.label}</span>
              <span className="font-semibold">
                {step.count}{" "}
                <span className="text-muted-foreground font-normal">
                  ({step.rate}%)
                </span>
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, step.rate))}%` }}
              />
            </div>
          </div>
        ))}

        <div className="border-border bg-muted/40 mt-3 flex items-start gap-2.5 rounded-lg border p-3">
          <Lightbulb className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs">{coachingTip}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TodayOutreachCardProps {
  outreachData?: {
    totalSent: number;
    recentOpens24h: number;
    totalOpens?: number;
    openRate?: number;
  };
  onNavigateOutreach: () => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}

function TodayOutreachCard({
  outreachData,
  onNavigateOutreach,
  t,
}: TodayOutreachCardProps) {
  const sent = outreachData?.totalSent ?? 0;
  const recent24h = outreachData?.recentOpens24h ?? 0;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold sm:text-lg">
            {t("today.outreachTitle")}
          </CardTitle>
          <MailCheck className="text-primary size-4" />
        </div>
        <CardDescription className="text-xs">
          {t("today.outreachDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-2">
          <div className="border-border bg-muted/20 rounded-lg border p-2.5">
            <span className="text-foreground block text-xl font-bold">
              {sent}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {t("today.outreachSent")}
            </span>
          </div>
          <div className="border-border bg-muted/20 rounded-lg border p-2.5">
            <span className="text-foreground block text-xl font-bold">
              {recent24h}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              24h
            </span>
          </div>
        </div>

        {recent24h > 0 ? (
          <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-2 text-xs font-medium">
            <Eye className="size-3.5 shrink-0" />
            <span>
              {t("today.outreachRecent24hAlert", { count: recent24h })}
            </span>
          </div>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateOutreach}
          className="w-full text-xs"
        >
          <span>{t("today.outreachOpenHub")}</span>
          <ArrowRight className="ml-1.5 size-3.5" aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}
