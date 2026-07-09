import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { SoftSkillForm } from "@/features/soft-skills/components/soft-skill-form";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSoftSkillModal({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const t = await getTranslations("admin.softSkills");

  const [item, languages] = await Promise.all([
    db.portfolioSoftSkill.findUnique({ where: { id } }),
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (item?.userId !== userId) {
    notFound();
  }

  return (
    <ModalWrapper title={t("edit")} description={t("editDescription")}>
      <SoftSkillForm initialData={item} languages={languages} />
    </ModalWrapper>
  );
}
