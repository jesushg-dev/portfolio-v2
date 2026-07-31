export { generateMetadata } from "../../../../projects/[id]/edit/metadata";
import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectEditPageData } from "@/features/projects/server/project-queries";

export default async function EditProjectModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.projects"),
    getProjectEditPageData(id),
  ]);

  if (!pageData) return null;
  const { editorDto, languages } = pageData;

  return (
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <ProjectForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
