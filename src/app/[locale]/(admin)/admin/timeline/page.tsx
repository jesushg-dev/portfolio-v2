import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TimelineList } from "@/features/timeline/components/timeline-list";
import { getUserTimelineWithLanguages } from "@/features/timeline/server/timeline-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TimelinePage({ params, searchParams }: Props) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as Locale);

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 10;

  const [t, { data: initialItems, languages, pageCount, totalCount }] =
    await Promise.all([
      getTranslations("admin.timeline"),
      getUserTimelineWithLanguages({ page, perPage, sort: [], filters: [] }),
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
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
