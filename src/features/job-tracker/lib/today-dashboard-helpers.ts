import { addBusinessDays } from "@/features/job-tracker/lib/application-next-step";
import type {
  ApplicationListRow,
  DashboardStats,
  UpcomingEvent,
} from "@/features/job-tracker/types";

export interface PendingFollowUpItem {
  application: ApplicationListRow;
  calendarDaysElapsed: number;
  businessDaysElapsed: number;
  isUrgent: boolean;
  lastEmailDaysAgo: number | null;
}

export interface SuggestedClosureItem {
  application: ApplicationListRow;
  calendarDaysElapsed: number;
}

export interface WeeklyTimelineDay {
  date: Date;
  isToday: boolean;
  isTomorrow: boolean;
  events: UpcomingEvent[];
  projectedFollowUps: ApplicationListRow[];
}

export interface ConversionFunnelMetrics {
  total: number;
  responded: number;
  interviews: number;
  offers: number;
  hired: number;
  respondedRate: number;
  interviewRate: number;
  offerRate: number;
  hiredRate: number;
}

const MS_PER_DAY = 86_400_000;

export function calendarDaysBetween(
  from: Date | string,
  to: Date = new Date(),
): number {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (start >= end) return 0;
  return Math.floor((end - start) / MS_PER_DAY);
}

export function businessDaysBetween(
  from: Date | string,
  to: Date = new Date(),
): number {
  const start = new Date(from);
  const end = new Date(to);
  if (start >= end) return 0;

  // Use UTC calendar dates so local timezone offsets (e.g., UTC-6) do not shift days
  const s = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const e = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );

  let count = 0;
  const current = new Date(s);
  while (current < e) {
    current.setUTCDate(current.getUTCDate() + 1);
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return count;
}

export function getPendingFollowUps(
  applications: ApplicationListRow[],
  now: Date = new Date(),
): PendingFollowUpItem[] {
  return applications
    .filter((app) => {
      if (app.status !== "APPLIED") return false;
      if (
        app.ghostNudgeSnoozedUntil &&
        new Date(app.ghostNudgeSnoozedUntil) > now
      ) {
        return false;
      }
      return businessDaysBetween(app.appliedDate, now) >= 5;
    })
    .map((app) => {
      const bDays = businessDaysBetween(app.appliedDate, now);
      const cDays = calendarDaysBetween(app.appliedDate, now);
      const lastEmailDays = app.emailSummary?.lastOpenedAt
        ? calendarDaysBetween(app.emailSummary.lastOpenedAt, now)
        : null;

      return {
        application: app,
        calendarDaysElapsed: cDays,
        businessDaysElapsed: bDays,
        isUrgent: bDays >= 12,
        lastEmailDaysAgo: lastEmailDays,
      };
    })
    .sort((a, b) => b.businessDaysElapsed - a.businessDaysElapsed);
}

export function getSuggestedClosures(
  applications: ApplicationListRow[],
  now: Date = new Date(),
): SuggestedClosureItem[] {
  return applications
    .filter((app) => {
      if (app.status !== "GHOSTED") return false;
      if (
        app.ghostNudgeSnoozedUntil &&
        new Date(app.ghostNudgeSnoozedUntil) > now
      ) {
        return false;
      }
      const refDate = app.updatedAt ?? app.appliedDate;
      return calendarDaysBetween(refDate, now) >= 30;
    })
    .map((app) => {
      const refDate = app.updatedAt ?? app.appliedDate;
      return {
        application: app,
        calendarDaysElapsed: calendarDaysBetween(refDate, now),
      };
    })
    .sort((a, b) => b.calendarDaysElapsed - a.calendarDaysElapsed);
}

export function getWeeklyTimeline(
  upcomingEvents: UpcomingEvent[],
  applications: ApplicationListRow[],
  now: Date = new Date(),
): WeeklyTimelineDay[] {
  const days: WeeklyTimelineDay[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toDateString();

    const dayEvents = upcomingEvents.filter(
      (event) => new Date(event.scheduledDate).toDateString() === dateStr,
    );

    const projectedFollowUps = applications.filter((app) => {
      if (app.status !== "APPLIED") return false;
      const dueDate = addBusinessDays(new Date(app.appliedDate), 5);
      return dueDate.toDateString() === dateStr;
    });

    days.push({
      date: targetDate,
      isToday: i === 0,
      isTomorrow: i === 1,
      events: dayEvents,
      projectedFollowUps,
    });
  }

  return days;
}

export function getFunnelMetrics(
  applications: ApplicationListRow[],
  stats?: DashboardStats,
): ConversionFunnelMetrics {
  const total = stats?.totalApplications ?? applications.length;
  if (total === 0) {
    return {
      total: 0,
      responded: 0,
      interviews: 0,
      offers: 0,
      hired: 0,
      respondedRate: 0,
      interviewRate: 0,
      offerRate: 0,
      hiredRate: 0,
    };
  }

  const respondedStatuses = new Set([
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ]);
  const interviewStatuses = new Set(["INTERVIEW", "OFFER", "HIRED"]);
  const offerStatuses = new Set(["OFFER", "HIRED"]);

  const responded = applications.filter((app) =>
    respondedStatuses.has(app.status),
  ).length;

  const interviews =
    stats?.inProgress !== undefined
      ? (stats.inProgress ?? 0) + (stats.offers ?? 0) + (stats.hired ?? 0)
      : applications.filter((app) => interviewStatuses.has(app.status)).length;

  const offers =
    stats?.offers !== undefined
      ? (stats.offers ?? 0) + (stats.hired ?? 0)
      : applications.filter((app) => offerStatuses.has(app.status)).length;

  const hired =
    stats?.hired !== undefined
      ? (stats.hired ?? 0)
      : applications.filter((app) => app.status === "HIRED").length;

  return {
    total,
    responded,
    interviews,
    offers,
    hired,
    respondedRate: Math.round((responded / total) * 100),
    interviewRate: Math.round((interviews / total) * 100),
    offerRate: Math.round((offers / total) * 100),
    hiredRate: Math.round((hired / total) * 100),
  };
}
