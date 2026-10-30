export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";

import { PageSheetWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectCreatePageData } from "@/features/projects/server/project-queries";

export default async function NewProjectPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.projects"),
    getProjectCreatePageData(),
  ]);

  return (
    <PageSheetWrapper
      title={t("create")}
      description={t("subtitle")}
      fallbackUrl="/admin/projects"
    >
      <ProjectForm initialData={initialData} languages={languages} />
    </PageSheetWrapper>
  );
}
