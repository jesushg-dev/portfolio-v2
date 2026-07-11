import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SoftSkillsList } from "@/features/soft-skills/components/soft-skills-list";
import { getUserSoftSkillsWithLanguages } from "@/features/soft-skills/server/soft-skill-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const SoftSkillsAdminPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, { data: initialItems, languages }] = await Promise.all([
    getTranslations("admin.softSkills"),
    getUserSoftSkillsWithLanguages(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <SoftSkillsList
        initialItems={initialItems}
        languages={languages}
        locale={locale as Locale}
      />
    </div>
  );
};

export default SoftSkillsAdminPage;
