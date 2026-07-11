import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { getTimelineEditPageData } from "@/features/timeline/server/timeline-queries";

export default async function EditTimelineModal({
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
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <TimelineItemForm
        key={formDto.id}
        initialData={formDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
