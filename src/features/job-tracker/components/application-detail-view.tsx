"use client";

import { useCallback, useRef, useState, useTransition, type FC } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Clock,
  FilePenLine,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import ScrollToTop from "@/components/custom-ui/scroll-to-top";
import { ApplicationTimeline } from "@/features/job-tracker/components/application-timeline";
import { ApplicationEmailDialog } from "@/features/job-tracker/components/application-email-panel";
import { ApplicationCoverLetterDialog } from "@/features/job-tracker/components/application-cover-letter-panel";
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
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rightPanelRef = useRef<HTMLDivElement>(null);
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

        <ButtonGroup aria-label={t("detail.actionsGroup")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEmailOpen(true)}
          >
            <Mail className="mr-1.5 size-3.5" aria-hidden />
            {t("email.openButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={{
                  pathname: "/admin/job-tracker/applications/[id]/edit",
                  params: { id: application.id },
                }}
              />
            }
          >
            <Pencil className="mr-1.5 size-3.5" aria-hidden />
            {t("detail.editApplicationButton")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setIsConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="mr-1.5 size-3.5" aria-hidden />
            )}
            {t("detail.deleteApplicationButton")}
          </Button>
        </ButtonGroup>
      </div>

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[36rem] lg:h-[calc(100dvh-8.5rem)]"
      >
        <ResizablePanel defaultSize="42%" minSize="30%" className="min-w-0">
          <section className="border-border bg-card h-full space-y-5 overflow-y-auto rounded-xl border p-5 shadow-sm">
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
                      <span className="truncate">
                        {application.cvFile.name}
                      </span>
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
              <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-foreground text-sm font-semibold">
                    {t("coverLetter.sectionTitle")}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {t("coverLetter.optionalHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary h-auto shrink-0 px-0"
                  onClick={() => setIsCoverLetterOpen(true)}
                >
                  <FilePenLine className="mr-1.5 size-3.5" aria-hidden />
                  {application.coverLetterBody.trim()
                    ? t("coverLetter.editButton")
                    : t("coverLetter.openOptional")}
                </Button>
              </header>
              {application.coverLetterBody.trim() ? (
                <div className="space-y-1.5">
                  {application.coverLetterSubject.trim() ? (
                    <p className="text-foreground text-sm font-medium">
                      {application.coverLetterSubject}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {application.coverLetterBody}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-border border-t pt-5">
              <header className="mb-3 flex items-center gap-2">
                <FileText
                  className="text-muted-foreground size-4"
                  aria-hidden
                />
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
        </ResizablePanel>

        <ResizableHandle withHandle className="mx-1" />

        <ResizablePanel defaultSize="58%" minSize="36%" className="min-w-0">
          <section className="border-border bg-card flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
            <nav
              aria-label={t("detail.tabsNavAria")}
              className="bg-muted/30 flex shrink-0 overflow-hidden rounded-t-xl"
            >
              {RIGHT_TABS.map(({ id, icon: Icon, labelKey }) => {
                const isActive = rightTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isActive}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-primary bg-card"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
                    )}
                    onClick={() => setRightTab(id)}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {t(labelKey)}
                  </button>
                );
              })}
            </nav>

            <div className="relative min-h-0 flex-1">
              <div
                ref={rightPanelRef}
                role="tabpanel"
                className="h-full overflow-y-auto p-5"
              >
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
                  />
                )}
              </div>
              <div className="pointer-events-none absolute right-3 bottom-3 z-20">
                <ScrollToTop containerRef={rightPanelRef} />
              </div>
            </div>
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ApplicationEmailDialog
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        applicationId={application.id}
        hasCvFile={Boolean(application.cvFile?.url)}
        cvFileName={application.cvFile?.name}
      />

      <ApplicationCoverLetterDialog
        open={isCoverLetterOpen}
        onOpenChange={setIsCoverLetterOpen}
        applicationId={application.id}
        initialSubject={application.coverLetterSubject}
        initialBody={application.coverLetterBody}
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
