import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { db } from "@/server/db";

export default async function NewProjectModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.actions");

  return (
    <PageDialogWrapper
      title={t("addNew")}
      description="Create a new portfolio project"
    >
      <ProjectForm languages={languages} />
    </PageDialogWrapper>
  );
}
