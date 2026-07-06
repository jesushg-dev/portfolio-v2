import { getTranslations } from "next-intl/server";
import { ProjectForm } from "@/features/projects/components/project-form";
import { db } from "@/server/db";

export default async function NewProjectPage() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.projects");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("create")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <ProjectForm languages={languages} />
      </div>
    </div>
  );
}
