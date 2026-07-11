import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectCreatePageData } from "@/features/projects/server/project-queries";

export default async function NewProjectModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.projects"),
    getProjectCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("addNew")} description={t("createDescription")}>
      <ProjectForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
