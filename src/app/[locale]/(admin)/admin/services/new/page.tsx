export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { PageSheetWrapper } from "@/components/shared/page-container";
import { ServiceForm } from "@/features/services/components/service-form";
import { getServiceCreatePageData } from "@/features/services/server/service-queries";

export default async function NewServicePage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.services"),
    getServiceCreatePageData(),
  ]);

  return (
    <PageSheetWrapper
      title={t("create")}
      description={t("createDescription")}
      fallbackUrl="/admin/services"
    >
      <ServiceForm initialData={initialData} languages={languages} />
    </PageSheetWrapper>
  );
}
