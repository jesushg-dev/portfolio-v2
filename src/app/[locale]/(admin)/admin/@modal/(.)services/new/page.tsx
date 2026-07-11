import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ServiceForm } from "@/features/services/components/service-form";
import { getServiceCreatePageData } from "@/features/services/server/service-queries";

export default async function NewServiceModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.services"),
    getServiceCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("create")} description={t("createDescription")}>
      <ServiceForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
