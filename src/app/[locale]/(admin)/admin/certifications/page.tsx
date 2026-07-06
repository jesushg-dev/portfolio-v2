import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { CertificationsList } from "@/features/certifications/components/certifications-list";

interface Props {
  params: Promise<{ locale: string }>;
}

const CertificationsPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.certifications");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const certifications = await db.certification.findMany({
    where: { userId },
    include: {
      CertificationTranslation: { include: { language: true } },
      CertificateSkill: { include: { Skill: true } },
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
        <CertificationsList initialCertifications={certifications} />
      </div>
    </div>
  );
};

export default CertificationsPage;
