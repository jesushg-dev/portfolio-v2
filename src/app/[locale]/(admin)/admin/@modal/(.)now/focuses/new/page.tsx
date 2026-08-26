export { generateMetadata } from "../../../../now/metadata";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { NowFocusForm } from "@/features/now/components/admin/now-focus-form";
import { getNowFocusCreatePageData } from "@/features/now/server/now-queries";

export default async function NewNowFocusModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.now"),
    getNowFocusCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("addFocus")}>
      <NowFocusForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
