export { generateMetadata } from "../../../../uses/metadata";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { UsesItemForm } from "@/features/uses/components/admin/uses-item-form";
import { getUsesItemEditPageData } from "@/features/uses/server/uses-queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUsesItemModal({ params }: Props) {
  const { id } = await params;
  const [t, { editorDto, languages }] = await Promise.all([
    getTranslations("admin.uses"),
    getUsesItemEditPageData(id),
  ]);

  return (
    <PageDialogWrapper
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <UsesItemForm initialData={editorDto} languages={languages} />
    </PageDialogWrapper>
  );
}
