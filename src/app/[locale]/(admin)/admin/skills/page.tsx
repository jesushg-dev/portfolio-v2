import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { SkillsList } from "@/features/skills/components/skills-list";

interface Props {
  params: Promise<{ locale: string }>;
}

const SkillsPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.skills");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const skills = await db.skill.findMany({
    where: { userId },
    include: {
      SkillTranslation: { include: { language: true } },
      _count: { select: { ProjectSkill: true, CertificateSkill: true, ServiceSkill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <SkillsList initialSkills={skills} />
      </div>
    </div>
  );
};

export default SkillsPage;
