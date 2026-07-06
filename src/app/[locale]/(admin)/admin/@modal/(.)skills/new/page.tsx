import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { SkillForm } from "@/features/skills/components/skill-form";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";

export default async function NewSkillModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  const t = await getTranslations("admin.skills");
  return (
    <ModalWrapper
      title={t("addNew") || "Create Skill"}
      description="Add a new skill to your portfolio"
    >
      <SkillForm  languages={languages} />
    </ModalWrapper>
  );
}
