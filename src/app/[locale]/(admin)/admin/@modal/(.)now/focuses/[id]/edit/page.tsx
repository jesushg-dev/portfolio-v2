export { generateMetadata } from "../../../../../now/metadata";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { NowFocusForm } from "@/features/now/components/admin/now-focus-form";
import { getNowFocusEditPageData } from "@/features/now/server/now-queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNowFocusModal({ params }: Props) {
  const { id } = await params;
  const [t, { editorDto, languages }] = await Promise.all([
    getTranslations("admin.now"),
    getNowFocusEditPageData(id),
  ]);

  return (
    <PageDialogWrapper title={t("editFocus")}>
      <NowFocusForm initialData={editorDto} languages={languages} />
    </PageDialogWrapper>
  );
}
