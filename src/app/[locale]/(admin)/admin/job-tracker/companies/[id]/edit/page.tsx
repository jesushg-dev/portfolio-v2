export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";

import { CompanyForm } from "@/features/job-tracker/components/company-form";
import { getCompanyEditPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function EditCompanyPage({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editCompany")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editCompanyDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CompanyForm key={editorDto.id} initialData={editorDto} />
      </div>
    </div>
  );
}
