import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { ApplicationDetailView } from "@/features/job-tracker/components/application-detail-view";
import { getApplicationDetailPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function ApplicationDetailModal({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [t, application] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationDetailPageData(id),
  ]);

  return (
    <PageDialogWrapper
      title={t("detail.title")}
      description={t("detail.description")}
      className="sm:max-w-5xl"
    >
      <ApplicationDetailView
        application={application}
        locale={locale as Locale}
      />
    </PageDialogWrapper>
  );
}
