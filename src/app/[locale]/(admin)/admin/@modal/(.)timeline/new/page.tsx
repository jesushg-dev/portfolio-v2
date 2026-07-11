import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { getTimelineCreatePageData } from "@/features/timeline/server/timeline-queries";

export default async function NewTimelineModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.timeline"),
    getTimelineCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("create")} description={t("createDescription")}>
      <TimelineItemForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
