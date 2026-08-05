"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Clock,
  FileText,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApplicationTimeline } from "@/features/job-tracker/components/application-timeline";
import { ResumeTailorWorkflow } from "@/features/resume-engine/components/resume-tailor-workflow";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { statusVariants } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type ApplicationDetailTab = "details" | "timeline" | "tailor";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
  locale: Locale;
  defaultTab?: ApplicationDetailTab;
}

const TAB_CONFIG: {
  id: ApplicationDetailTab;
  icon: FC<{ className?: string }>;
}[] = [
  { id: "details", icon: FileText },
  { id: "timeline", icon: Clock },
  { id: "tailor", icon: Sparkles },
];

export const ApplicationDetailView: FC<ApplicationDetailViewProps> = ({
  application,
  locale,
  defaultTab = "details",
}) => {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const utils = api.useUtils();
  const [activeTab, setActiveTab] = useState<ApplicationDetailTab>(defaultTab);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dateFnsLocale = getDateFnsLocale(locale);
  const deleteApplication = api.jobTrackerAdmin.deleteApplication.useMutation();

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteApplication.mutateAsync({ id: application.id });
        toast.success(t("deleteApplicationSuccess"));
        await Promise.all([
          utils.jobTrackerAdmin.getApplications.invalidate(),
          utils.jobTrackerAdmin.getDashboardStats.invalidate(),
        ]);
        router.push("/admin/job-tracker");
      } catch {
        toast.error(t("deleteApplicationError"));
      } finally {
        setIsConfirmOpen(false);
      }
    });
  }, [application.id, deleteApplication, router, t, utils]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/job-tracker"
          className="text-muted-foreground hover:text-foreground mb-1 block text-xs transition-colors"
        >
          {t("detail.breadcrumb")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {application.position}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <span className="text-muted-foreground text-sm">
            {application.company.name}
          </span>
          <Badge variant={statusVariants[application.status]}>
            {t(`status.${application.status}`)}
          </Badge>
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border shadow-sm">
        <nav
          aria-label={t("detail.tabsNavAria")}
          className="bg-muted/30 flex overflow-x-auto rounded-t-xl"
          role="tablist"
        >
          {TAB_CONFIG.map(({ id, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary bg-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(
                  id === "details"
                    ? "detail.detailsTab"
                    : id === "timeline"
                      ? "detail.timelineTab"
                      : "detail.tailorTab",
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <ApplicationMetadataBar
            application={application}
            dateFnsLocale={dateFnsLocale}
            isConfirmOpen={isConfirmOpen}
            isDeleting={isPending}
            onConfirmOpenChange={setIsConfirmOpen}
            onDelete={handleDelete}
            t={t}
          />

          <div role="tabpanel" className="w-full">
            {activeTab === "details" ? (
              <ApplicationJobDescription
                description={application.description}
                notes={application.notes}
                emptyLabel={t("detail.noDescription")}
                notesLabel={t("detail.notes")}
              />
            ) : null}

            {activeTab === "timeline" ? (
              <ApplicationTimeline
                application={application}
                locale={locale}
                variant="embedded"
                activityHint={t("detail.timelineActivityHint")}
              />
            ) : null}

            {activeTab === "tailor" ? (
              <ResumeTailorWorkflow
                applicationId={application.id}
                embedded
                existingCvFile={application.cvFile}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

function ApplicationJobDescription({
  description,
  notes,
  emptyLabel,
  notesLabel,
}: {
  description: string;
  notes: string;
  emptyLabel: string;
  notesLabel: string;
}) {
  if (!description.trim() && !notes.trim()) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
      {description.trim() ? (
        <div className="whitespace-pre-wrap">{description}</div>
      ) : null}
      {notes.trim() ? (
        <div className="border-border border-t pt-6">
          <h3 className="text-foreground mb-2 text-sm font-medium">
            {notesLabel}
          </h3>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationMetadataBar({
  application,
  dateFnsLocale,
  isConfirmOpen,
  isDeleting,
  onConfirmOpenChange,
  onDelete,
  t,
}: {
  application: ApplicationDetail;
  dateFnsLocale: ReturnType<typeof getDateFnsLocale>;
  isConfirmOpen: boolean;
  isDeleting: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}) {
  const appliedLabel = format(new Date(application.appliedDate), "PP", {
    locale: dateFnsLocale,
  });

  return (
    <div className="border-border mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <dl className="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {application.salary.trim() ? (
          <MetadataItem label={t("detail.salary")} value={application.salary} />
        ) : null}
        {application.location.trim() ? (
          <MetadataItem
            label={t("detail.location")}
            value={application.location}
          />
        ) : null}
        <MetadataItem label={t("detail.applied")} value={appliedLabel} />
        {application.cvFile ? (
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">
              {t("detail.resumeOnFile")}
            </dt>
            <dd>
              <a
                href={application.cvFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
              >
                <FileText className="size-3.5 shrink-0" aria-hidden />
                {application.cvFile.name}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={{
            pathname: "/admin/job-tracker/applications/[id]/edit",
            params: { id: application.id },
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil className="mr-1.5 size-3.5" aria-hidden />
          {t("detail.editApplicationButton")}
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={() => onConfirmOpenChange(true)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
        >
          {isDeleting ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="mr-1.5 size-3.5" aria-hidden />
          )}
          {t("detail.deleteApplicationButton")}
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={t("detail.deleteApplicationButton")}
        description={t("detail.deleteApplicationConfirm")}
        cancelLabel={t("detail.deleteCancel")}
        confirmLabel={t("detail.deleteConfirmAction")}
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={onDelete}
      />
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-sm">{value}</dd>
    </div>
  );
}
