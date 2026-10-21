export { generateMetadata } from "./metadata";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

import { InterviewPrepWorkflow } from "@/features/resume-engine/components/interview-prep-workflow";
import { getEventPrepPageData } from "@/features/job-tracker/server/job-tracker-queries";
import { EventTypeIcon } from "@/features/job-tracker/lib/event-type-icons";
import { EventDeleteControl } from "@/features/job-tracker/components/event-delete-control";

export default async function EventPrepPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  const [t, { application, event }] = await Promise.all([
    getTranslations("admin.jobTracker"),
    getEventPrepPageData(id, eventId),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={{
              pathname: "/admin/job-tracker/applications/[id]",
              params: { id: application.id },
            }}
            className="text-muted-foreground hover:text-foreground mb-1 block text-xs transition-colors"
          >
            {t("interviewPrep.breadcrumb")}
          </Link>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <EventTypeIcon
              type={event.type}
              className="text-muted-foreground size-5 shrink-0"
            />
            {event.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("interviewPrep.pageTitle")} · {application.position} ·{" "}
            {application.company.name}
          </p>
        </div>
        <EventDeleteControl
          applicationId={application.id}
          eventId={event.id}
          appearance="button"
          afterDelete="application"
        />
      </div>
      <InterviewPrepWorkflow
        applicationId={application.id}
        eventId={event.id}
      />
    </div>
  );
}
