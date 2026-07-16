import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { ApplicationDetailView } from "@/features/job-tracker/components/application-detail-view";
import { getApplicationDetailPageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, id } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale as Locale);

  const defaultTab = tab === "tailor" || tab === "details" ? tab : "timeline";

  const [t, application] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getApplicationDetailPageData(id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("detail.title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("detail.description")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <ApplicationDetailView
          application={application}
          locale={locale as Locale}
          defaultTab={defaultTab}
        />
      </div>
    </div>
  );
}
