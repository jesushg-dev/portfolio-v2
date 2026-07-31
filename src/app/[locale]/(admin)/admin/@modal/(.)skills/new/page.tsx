export { generateMetadata } from "../../../skills/new/metadata";
import { getTranslations } from "next-intl/server";
import { SkillForm } from "@/features/skills/components/skill-form";
import { getSkillCreatePageData } from "@/features/skills/server/skill-queries";
import { PageDialogWrapper } from "@/components/shared/page-container";

export default async function NewSkillModal() {
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.skills"),
    getSkillCreatePageData(),
  ]);

  return (
    <PageDialogWrapper title={t("addNew")} description={t("createDescription")}>
      <SkillForm initialData={initialData} languages={languages} />
    </PageDialogWrapper>
  );
}
