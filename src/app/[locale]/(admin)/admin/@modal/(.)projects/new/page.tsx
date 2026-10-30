export { generateMetadata } from "../../../projects/new/metadata";
import { getTranslations } from "next-intl/server";
import { PageSheetWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectCreatePageData } from "@/features/projects/server/project-queries";

export default async function NewProjectModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.projects"),
    getProjectCreatePageData(),
  ]);

  return (
    <PageSheetWrapper title={t("addNew")} description={t("createDescription")}>
      <ProjectForm initialData={initialData} languages={languages} />
    </PageSheetWrapper>
  );
}
