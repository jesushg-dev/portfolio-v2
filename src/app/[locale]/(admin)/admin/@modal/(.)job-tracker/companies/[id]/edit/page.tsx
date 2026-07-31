export { generateMetadata } from "../../../../../job-tracker/companies/[id]/edit/metadata";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { CompanyForm } from "@/features/job-tracker/components/company-form";
import { getCompanyEditPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function EditCompanyModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getCompanyEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto } = pageData;

  return (
    <PageDialogWrapper
      title={t("editCompany")}
      description={t("editCompanyDescription")}
    >
      <CompanyForm key={editorDto.id} initialData={editorDto} />
    </PageDialogWrapper>
  );
}
