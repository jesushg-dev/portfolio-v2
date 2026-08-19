export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";

import { CompanyForm } from "@/features/job-tracker/components/company-form";
import { getCompanyCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewCompanyPage() {
  const t = await getTranslations("admin.jobTracker");
  const { initialData } = getCompanyCreatePageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("createCompany")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("createCompanyDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <CompanyForm initialData={initialData} />
      </div>
    </div>
  );
}
