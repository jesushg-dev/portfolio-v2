export { generateMetadata } from "./metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";

import { EventForm } from "@/features/job-tracker/components/event-form";
import { getEventCreatePageData } from "@/features/job-tracker/server/job-tracker-queries";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as Locale);

  const applicationId =
    typeof search.applicationId === "string" ? search.applicationId : undefined;

  const [t, { initialData, applications }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getEventCreatePageData(applicationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("createEvent")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("createEventDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <EventForm
          initialData={initialData}
          applications={applications}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
}
