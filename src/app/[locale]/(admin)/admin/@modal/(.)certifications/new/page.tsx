import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { CertificationForm } from "@/features/certifications/components/certification-form";
import { getCertificationCreatePageData } from "@/features/certifications/server/certification-queries";

export default async function NewCertificationModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.certifications"),
    getCertificationCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("create")} description={t("createDescription")}>
      <CertificationForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
