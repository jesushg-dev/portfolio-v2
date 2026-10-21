import {
  emptyAnalyticsSummary,
  summarizeAnalyticsRows,
  type AnalyticsSummary,
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
      path: true,
      country: true,
      referrerHost: true,
      pageviews: true,
      visits: true,
    },
  });

  if (rows.length === 0) return emptyAnalyticsSummary();

  const summary = summarizeAnalyticsRows(rows);
  if (!options.includeReferrers) {
    return { ...summary, referrers: [] };
  }
  return summary;
}
