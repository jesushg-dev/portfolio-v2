import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { getSoftSkillEditPageData } from "@/features/soft-skills/server/soft-skill-queries";

export default async function EditSoftSkillModal({
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
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <SoftSkillForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
