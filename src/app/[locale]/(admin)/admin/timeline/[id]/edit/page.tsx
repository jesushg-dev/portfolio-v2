import { getTranslations } from "next-intl/server";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { getTimelineEditPageData } from "@/features/timeline/server/timeline-queries";

export default async function EditTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.timeline"),
    getTimelineEditPageData(id),
  ]);

  if (!pageData) return null;
  const { formDto, languages } = pageData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <TimelineItemForm
          key={formDto.id}
          initialData={formDto}
          languages={languages}
        />
      </div>
    </div>
  );
}
