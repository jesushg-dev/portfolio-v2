export { generateMetadata } from "../../../../job-tracker/companies/new/metadata";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { CompanyForm } from "@/features/job-tracker/components/company-form";
import { getCompanyCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewCompanyModal() {
  const t = await getTranslations("admin.jobTracker");
  const { initialData } = getCompanyCreatePageData();

  return (
    <PageDialogWrapper
      title={t("createCompany")}
      description={t("createCompanyDescription")}
    >
      <CompanyForm initialData={initialData} />
    </PageDialogWrapper>
  );
}
