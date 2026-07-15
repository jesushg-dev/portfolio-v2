import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { EventForm } from "@/features/job-tracker/components/event-form";
import { getEventCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewEventModal({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const applicationId =
    typeof search.applicationId === "string" ? search.applicationId : undefined;

  const [t, { initialData, applications }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getEventCreatePageData(applicationId),
  ]);

  return (
    <PageDialogWrapper
      title={t("createEvent")}
      description={t("createEventDescription")}
    >
      <EventForm
        initialData={initialData}
        applications={applications}
        locale={locale as Locale}
      />
    </PageDialogWrapper>
  );
}
