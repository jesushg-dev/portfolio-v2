import { getTranslations } from "next-intl/server";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { getTimelineCreatePageData } from "@/features/timeline/server/timeline-queries";

export default async function NewTimelinePage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.timeline"),
    getTimelineCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <TimelineItemForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
