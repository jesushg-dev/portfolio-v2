export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("editDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ProjectForm
          key={editorDto.id}
          initialData={editorDto}
          languages={languages}
        />
      </div>
    </div>
  );
}
