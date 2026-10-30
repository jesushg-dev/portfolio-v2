export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";

import { PageSheetWrapper } from "@/components/shared/page-container";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectEditPageData } from "@/features/projects/server/project-queries";

export default async function EditProjectPage({
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
    <PageSheetWrapper
      title={t("edit")}
      description={t("editDescription")}
      fallbackUrl="/admin/projects"
    >
      <ProjectForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageSheetWrapper>
  );
}
