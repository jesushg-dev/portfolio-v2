import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { SkillForm } from "@/features/skills/components/skill-form";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditSkillModal({ params }: Props) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  const t = await getTranslations("admin.skills");

  const { id } = await params;

  const skill = await db.skill.findUnique({
    where: { id },
    include: { SkillTranslation: true },
  });

  if (!skill) {
    notFound();
  }

  return (
    <ModalWrapper
      title={t("edit")}
      description={t("editDescription")}
    >
      <SkillForm initialData={skill} languages={languages} />
    </ModalWrapper>
  );
}
