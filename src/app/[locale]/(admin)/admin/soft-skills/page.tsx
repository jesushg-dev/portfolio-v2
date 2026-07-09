import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { SoftSkillsList } from "@/features/soft-skills/components/soft-skills-list";

interface Props {
  params: Promise<{ locale: string }>;
}

const SoftSkillsAdminPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.softSkills");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const items = await db.portfolioSoftSkill.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <SoftSkillsList initialItems={items} locale={locale as Locale} />
    </div>
  );
};

export default SoftSkillsAdminPage;
