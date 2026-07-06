import { getTranslations } from "next-intl/server";
import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { TimelineItemForm } from "@/features/timeline/components/timeline-item-form";
import { db } from "@/server/db";

export default async function NewTimelineItemModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.timeline");
  return (
    <ModalWrapper
      title={t("addNew")}
      description="Add a new item to your timeline"
    >
      <TimelineItemForm languages={languages} />
    </ModalWrapper>
  );
}
