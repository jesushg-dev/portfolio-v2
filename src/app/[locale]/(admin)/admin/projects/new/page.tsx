import { getTranslations } from "next-intl/server";

import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectCreatePageData } from "@/features/projects/server/project-queries";

export default async function NewProjectPage() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.projects"),
    getProjectCreatePageData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ProjectForm initialData={initialData} languages={languages} />
      </div>
    </div>
  );
}
