import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { ApplicationForm } from "@/features/job-tracker/components/application-form";
import { getApplicationCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewApplicationModal({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, { initialData, companies }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationCreatePageData(),
  ]);

  return (
    <PageDialogWrapper
      title={t("createApplication")}
      description={t("createApplicationDescription")}
    >
      <ApplicationForm
        initialData={initialData}
        companies={companies}
        locale={locale as Locale}
      />
    </PageDialogWrapper>
  );
}
