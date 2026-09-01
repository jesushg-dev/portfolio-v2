export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/routing";

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

  const applicationId =
    typeof search.applicationId === "string" ? search.applicationId : undefined;

  const [t, { initialData, applications }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getEventCreatePageData(applicationId),
  ]);

  const linkedApplication = applications.find(
    (application) => application.id === applicationId,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        {linkedApplication ? (
          <Link
            href={{
              pathname: "/admin/job-tracker/applications/[id]",
              params: { id: linkedApplication.id },
            }}
            className="text-muted-foreground hover:text-foreground mb-1 block text-xs transition-colors"
          >
            {t("detail.breadcrumb")}
          </Link>
        ) : (
          <Link
            href="/admin/job-tracker"
            className="text-muted-foreground hover:text-foreground mb-1 block text-xs transition-colors"
          >
            {t("title")}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("createEvent")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {linkedApplication
            ? `${linkedApplication.position} · ${linkedApplication.company.name}`
            : t("createEventDescription")}
        </p>
      </div>
      <EventForm
        initialData={initialData}
        applications={applications}
        locale={locale as Locale}
      />
    </div>
  );
}
