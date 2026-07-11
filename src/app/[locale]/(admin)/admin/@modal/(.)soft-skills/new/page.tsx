import { getTranslations } from "next-intl/server";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { getSoftSkillCreatePageData } from "@/features/soft-skills/server/soft-skill-queries";

export default async function NewSoftSkillModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.softSkills"),
    getSoftSkillCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("addNew")} description={t("createDescription")}>
      <SoftSkillForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
