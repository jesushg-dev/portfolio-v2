export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { PageSheetWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { getCertificationCreatePageData } from "@/features/certifications/server/certification-queries";

export default async function NewCertificationPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.certifications"),
    getCertificationCreatePageData(),
  ]);

  return (
    <PageSheetWrapper
      title={t("create")}
      description={t("createDescription")}
      fallbackUrl="/admin/certifications"
    >
      <CertificationForm initialData={initialData} languages={languages} />
    </PageSheetWrapper>
  );
}
