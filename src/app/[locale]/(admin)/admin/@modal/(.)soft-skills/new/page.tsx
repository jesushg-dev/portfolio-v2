import { getTranslations } from "next-intl/server";
import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { db } from "@/server/db";

export default async function NewSoftSkillModal() {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  const t = await getTranslations("admin.softSkills");

  return (
    <ModalWrapper title={t("addNew")} description={t("createDescription")}>
      <SoftSkillForm languages={languages} />
    </ModalWrapper>
  );
}
