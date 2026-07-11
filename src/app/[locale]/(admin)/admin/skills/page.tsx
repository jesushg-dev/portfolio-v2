import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SkillsList } from "@/features/skills/components/skills-list";
import { getUserSkillsWithLanguages } from "@/features/skills/server/skill-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const SkillsPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, { data: initialSkills }] = await Promise.all([
    getTranslations("admin.skills"),
    getUserSkillsWithLanguages(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <SkillsList initialSkills={initialSkills} />
      </div>
    </div>
  );
};

export default SkillsPage;
