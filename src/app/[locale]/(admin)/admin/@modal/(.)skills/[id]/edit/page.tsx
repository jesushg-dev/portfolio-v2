export { generateMetadata } from "../../../../skills/[id]/edit/metadata";
import { getTranslations } from "next-intl/server";
import { SkillForm } from "@/features/skills/components/skill-form";
import { getSkillEditPageData } from "@/features/skills/server/skill-queries";
import { PageDialogWrapper } from "@/components/shared/page-container";

export default async function EditSkillModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, pageData] = await Promise.all([
    getTranslations("admin.skills"),
    getSkillEditPageData(id),
  ]);
  if (!pageData) return null;
  const { editorDto, languages } = pageData;
  return (
    <PageDialogWrapper title={t("edit")} description={t("editDescription")}>
      <SkillForm
        key={editorDto.id}
        initialData={editorDto}
        languages={languages}
      />
    </PageDialogWrapper>
  );
}
