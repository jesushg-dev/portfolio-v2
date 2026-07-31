export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { getSoftSkillEditPageData } from "@/features/soft-skills/server/soft-skill-queries";

export default async function EditSoftSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.softSkills"),
    getSoftSkillEditPageData(id),
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
        <SoftSkillForm
          key={editorDto.id}
          initialData={editorDto}
          languages={languages}
        />
      </div>
    </div>
  );
}
