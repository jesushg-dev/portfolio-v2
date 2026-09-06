import { z } from "zod";

import { toAnalyticsPath } from "@/features/analytics/lib/analytics-path";
import {
  normalizeCountryCode,
  referrerHostFromUrl,
} from "@/features/analytics/lib/referrer-host";
import { shouldSkipCollect } from "@/features/analytics/lib/should-skip-collect";
import {
  analyticsRetentionCutoff,
  utcDay,
} from "@/features/analytics/lib/utc-day";
import { auth } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";

export const collectPayloadSchema = z.object({
  path: z.string().max(500),
  referrer: z.string().max(2000).optional().default(""),
  isNewVisit: z.boolean().optional().default(false),
});

const emptyResponse = () =>
  new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

async function incrementDailyStat(input: {
  userId: string;
  date: Date;
  path: string;
  country: string;
  referrerHost: string;
  isNewVisit: boolean;
}) {
  const where = {
    userId_date_path_country_referrerHost: {
      userId: input.userId,
      date: input.date,
      path: input.path,
      country: input.country,
      referrerHost: input.referrerHost,
    },
  };

  const update = input.isNewVisit
    ? { pageviews: { increment: 1 }, visits: { increment: 1 } }
    : { pageviews: { increment: 1 } };

  try {
    await db.analyticsDailyStat.upsert({
      where,
      create: {
        userId: input.userId,
        date: input.date,
        path: input.path,
        country: input.country,
        referrerHost: input.referrerHost,
        pageviews: 1,
        visits: input.isNewVisit ? 1 : 0,
      },
      update,
    });
  } catch {
    await db.analyticsDailyStat.update({
      where,
      data: update,
    });
  }
}

async function maybePruneOldStats(userId: string) {
  if (Math.random() > 0.02) return;
  await db.analyticsDailyStat.deleteMany({
    where: {
      userId,
      date: { lt: analyticsRetentionCutoff() },
    },
  });
}

export async function handleAnalyticsCollect(
  request: Request,
): Promise<Response> {
  try {
    const json: unknown = await request.json();
    const parsed = collectPayloadSchema.safeParse(json);
    if (!parsed.success) return emptyResponse();

    const headers = request.headers;
    const tenant = await resolveTenant();
    if (!tenant) return emptyResponse();

    const session = await auth.api.getSession({ headers });
    const isOwner = session?.user?.id === tenant.userId;
    const analyticsPath = toAnalyticsPath(parsed.data.path);

    if (
      shouldSkipCollect({
        dnt: headers.get("dnt"),
        gpc: headers.get("sec-gpc"),
        userAgent: headers.get("user-agent"),
        analyticsPath,
        isOwner,
      })
    ) {
      return emptyResponse();
    }

    const host =
      headers.get("x-forwarded-host") ?? headers.get("host") ?? undefined;

    await incrementDailyStat({
      userId: tenant.userId,
      date: utcDay(),
      path: analyticsPath,
      country: normalizeCountryCode(headers.get("x-vercel-ip-country")),
      referrerHost: referrerHostFromUrl(parsed.data.referrer, host),
      isNewVisit: parsed.data.isNewVisit,
    });

    void maybePruneOldStats(tenant.userId);

    return emptyResponse();
  } catch {
    return emptyResponse();
  }
}
