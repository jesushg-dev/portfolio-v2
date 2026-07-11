import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CertificationsList } from "@/features/certifications/components/certifications-list";
import { getUserCertificationsWithLanguages } from "@/features/certifications/server/certification-queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const CertificationsPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, { data: initialCertifications, languages }] = await Promise.all([
    getTranslations("admin.certifications"),
    getUserCertificationsWithLanguages(),
  ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <CertificationsList
          initialCertifications={initialCertifications}
          languages={languages}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
};

export default CertificationsPage;
