export { generateMetadata } from "./metadata";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { ApplicationDetailView } from "@/features/job-tracker/components/application-detail-view";
import { getApplicationDetailPageData } from "@/features/job-tracker/server/job-tracker-queries";

type ApplicationDetailTab = "details" | "timeline" | "tailor";

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

  const defaultTab: ApplicationDetailTab =
    tab === "tailor" || tab === "timeline" || tab === "details"
      ? tab
      : "details";

  const application = await getApplicationDetailPageData(id);

  return (
    <ApplicationDetailView
      application={application}
      locale={locale as Locale}
      defaultTab={defaultTab}
    />
  );
}
