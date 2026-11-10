import {
  emptyAnalyticsSummary,
  summarizeAnalyticsRows,
  type AnalyticsSummary,
  type DailyVisitPoint,
} from "@/features/analytics/lib/summarize";
import { utcDaysAgo } from "@/features/analytics/lib/utc-day";
import { db } from "@/server/db";

export type { AnalyticsSummary };

const DEFAULT_RANGE_DAYS = 30;

export async function getAnalyticsSummary(
  userId: string,
  options: { days?: number; includeReferrers?: boolean } = {},
): Promise<AnalyticsSummary> {
  const days = options.days ?? DEFAULT_RANGE_DAYS;
  const since = utcDaysAgo(days);

  const rows = await db.analyticsDailyStat.findMany({
    where: {
      userId,
      date: { gte: since },
    },
    select: {
      date: true,
      path: true,
      country: true,
      referrerHost: true,
      pageviews: true,
      visits: true,
    },
  });

  const dailyVisitsMap = new Map<string, number>();
  for (const row of rows) {
    if (row.date) {
      const dayKey = (row.date instanceof Date ? row.date : new Date(row.date))
        .toISOString()
        .slice(0, 10);
      dailyVisitsMap.set(
        dayKey,
        (dailyVisitsMap.get(dayKey) ?? 0) + row.visits,
      );
    }
  }

  const dailyVisits: DailyVisitPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = utcDaysAgo(i);
    const dayKey = d.toISOString().slice(0, 10);
    dailyVisits.push({
      date: dayKey,
      visits: dailyVisitsMap.get(dayKey) ?? 0,
    });
  }

  if (rows.length === 0) {
    return { ...emptyAnalyticsSummary(), dailyVisits };
  }

  const summary = summarizeAnalyticsRows(rows);
  const result: AnalyticsSummary = {
    ...summary,
    dailyVisits,
  };

  if (!options.includeReferrers) {
    return { ...result, referrers: [] };
  }
  return result;
}
