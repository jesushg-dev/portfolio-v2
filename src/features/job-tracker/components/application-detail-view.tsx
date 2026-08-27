"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Clock,
  FileText,
  Loader2,
  Mail,
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
import { ApplicationEmailDialog } from "@/features/job-tracker/components/application-email-panel";
import { ResumeTailorWorkflow } from "@/features/resume-engine/components/resume-tailor-workflow";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { statusVariants } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type RightPanelTab = "timeline" | "tailor";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
  locale: Locale;
  /** Optional deep-link target (`?tab=timeline|tailor`). */
  defaultTab?: "details" | RightPanelTab;
}

const RIGHT_TABS: {
  id: RightPanelTab;
  icon: FC<{ className?: string }>;
  labelKey: "detail.timelineTab" | "detail.tailorTab";
}[] = [
  { id: "timeline", icon: Clock, labelKey: "detail.timelineTab" },
  { id: "tailor", icon: Sparkles, labelKey: "detail.tailorTab" },
];

const DESCRIPTION_COLLAPSE_CHARS = 480;

export const ApplicationDetailView: FC<ApplicationDetailViewProps> = ({
  application,
  locale,
  defaultTab = "details",
}) => {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const utils = api.useUtils();
  const [rightTab, setRightTab] = useState<RightPanelTab>(
    defaultTab === "tailor" || defaultTab === "timeline"
      ? defaultTab
      : "timeline",
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
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

  const appliedLabel = format(new Date(application.appliedDate), "PP", {
    locale: dateFnsLocale,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEmailOpen(true)}
          >
            <Mail className="mr-1.5 size-3.5" aria-hidden />
            {t("email.openButton")}
          </Button>
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
            disabled={isPending}
            onClick={() => setIsConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="mr-1.5 size-3.5" aria-hidden />
            )}
            {t("detail.deleteApplicationButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <section className="border-border bg-card space-y-5 rounded-xl border p-5 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label={t("detail.applied")} value={appliedLabel} />
            <DetailField
              label={t("detail.location")}
              value={application.location.trim() || t("detail.notProvided")}
            />
            <DetailField
              label={t("detail.salary")}
              value={application.salary.trim() || t("detail.notProvided")}
            />
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t("detail.cv")}
              </dt>
              <dd className="text-foreground mt-1 text-sm">
                {application.cvFile ? (
                  <a
                    href={application.cvFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex max-w-full items-center gap-1.5 hover:underline"
                  >
                    <FileText className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{application.cvFile.name}</span>
                  </a>
                ) : (
                  t("detail.notProvided")
                )}
              </dd>
            </div>
          </dl>

          {application.notes.trim() ? (
            <div className="border-border border-t pt-5">
              <h2 className="text-foreground mb-2 text-sm font-semibold">
                {t("detail.notes")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {application.notes}
              </p>
            </div>
          ) : null}

          <div className="border-border border-t pt-5">
            <header className="mb-3 flex items-center gap-2">
              <FileText className="text-muted-foreground size-4" aria-hidden />
              <h2 className="text-sm font-semibold">
                {t("detail.jobDescription")}
              </h2>
            </header>
            <CollapsibleJobDescription
              description={application.description}
              emptyLabel={t("detail.noDescription")}
              showMoreLabel={t("detail.showFullDescription")}
              showLessLabel={t("detail.hideFullDescription")}
            />
          </div>
        </section>

        <section className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100dvh-5.5rem)]">
          <nav
            aria-label={t("detail.tabsNavAria")}
            className="bg-muted/40 border-border shrink-0 border-b"
            role="tablist"
          >
            <div className="flex">
              {RIGHT_TABS.map(({ id, icon: Icon, labelKey }) => {
                const isActive = rightTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setRightTab(id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-primary bg-card"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </nav>

          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-5">
            {rightTab === "timeline" ? (
              <ApplicationTimeline
                application={application}
                locale={locale}
                variant="embedded"
                activityHint={t("detail.timelineActivityHint")}
              />
            ) : (
              <ResumeTailorWorkflow
                applicationId={application.id}
                embedded
                existingCvFile={application.cvFile}
                previewDefaultOpen
              />
            )}
          </div>
        </section>
      </div>

      <ApplicationEmailDialog
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        applicationId={application.id}
        hasCvFile={Boolean(application.cvFile?.url)}
        cvFileName={application.cvFile?.name}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t("detail.deleteApplicationButton")}
        description={t("detail.deleteApplicationConfirm")}
        cancelLabel={t("detail.deleteCancel")}
        confirmLabel={t("detail.deleteConfirmAction")}
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1 truncate text-sm">{value}</dd>
    </div>
  );
}

function CollapsibleJobDescription({
  description,
  emptyLabel,
  showMoreLabel,
  showLessLabel,
}: {
  description: string;
  emptyLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const trimmed = description.trim();
  const [expanded, setExpanded] = useState(false);
  const canCollapse = trimmed.length > DESCRIPTION_COLLAPSE_CHARS;

  if (!trimmed) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <div>
      <div
        className={cn(
          "text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap",
          !expanded && canCollapse && "max-h-40 overflow-hidden",
        )}
      >
        {trimmed}
      </div>
      {canCollapse ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary mt-2 h-auto px-0"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? showLessLabel : showMoreLabel}
        </Button>
      ) : null}
    </div>
  );
}
