import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TimelineList } from "@/features/timeline/components/timeline-list";
import { getUserTimelineWithLanguages } from "@/features/timeline/server/timeline-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function TimelinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, { data: initialItems, languages }] = await Promise.all([
    getTranslations("admin.timeline"),
    getUserTimelineWithLanguages(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <TimelineList
          initialItems={initialItems}
          languages={languages}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
}
