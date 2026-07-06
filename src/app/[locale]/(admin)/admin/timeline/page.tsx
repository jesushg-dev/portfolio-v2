import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { TimelineList } from "@/features/timeline/components/timeline-list";

interface Props {
  params: Promise<{ locale: string }>;
}

const TimelinePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.timeline");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const timelineItemDelegate = (db as { timelineItem?: typeof db.timelineItem })
    .timelineItem;

  const timelineItems = timelineItemDelegate
    ? await timelineItemDelegate.findMany({
        where: { userId },
        orderBy: [{ order: "asc" }, { startDate: "desc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <TimelineList initialItems={timelineItems} locale={locale as Locale} />
    </div>
  );
};

export default TimelinePage;
