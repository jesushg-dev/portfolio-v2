"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type FC,
} from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Building2,
  Clock,
  ExternalLink,
  FilePenLine,
  FileText,
  Globe,
  Loader2,
  Mail,
  MailOpen,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { LinkedinIcon } from "@/components/shared/brand-icons";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApplicationTimeline } from "@/features/job-tracker/components/application-timeline";
import { ApplicationEmailHistory } from "@/features/job-tracker/components/application-email-history";
import { ApplicationEmailDialog } from "@/features/job-tracker/components/application-email-panel";
import { ApplicationNextStepBanner } from "@/features/job-tracker/components/application-next-step-banner";
import { ApplicationProcessPath } from "@/features/job-tracker/components/application-process-path";
import { ApplicationEventResultDialog } from "@/features/job-tracker/components/application-event-result-dialog";
import { ApplicationCoverLetterDialog } from "@/features/job-tracker/components/application-cover-letter-panel";
import { ResumeTailorWorkflow } from "@/features/resume-engine/components/resume-tailor-workflow";
import type { ApplicationDetail } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import {
  cleanImportedJobDescription,
  getApplicationDetailNotices,
  splitHighlightedDescription,
  type DetailNotice,
} from "@/features/job-tracker/lib/application-detail-content";

type RightPanelTab = "timeline" | "tailor" | "emails";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
  locale: Locale;
  /** Optional deep-link target for a workspace tab. */
  defaultTab?: "details" | RightPanelTab;
  viewerId?: string;
  viewerEmail?: string;
  matchAnalysis?: CvMatchAnalysis | null;
  resumeTitle?: string | null;
  canCloseSearch?: boolean;
}

const DESCRIPTION_COLLAPSE_CHARS = 480;
const STATUS_OPTIONS: Record<ApplicationDetail["status"], true> = {
  APPLIED: true,
  INTERVIEW: true,
  OFFER: true,
  GHOSTED: true,
  REJECTED: true,
  HIRED: true,
};

function subscribeStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredNoticesRaw(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function getServerEmptyString() {
  return "";
}

function parseResolvedNotices(raw: string): DetailNotice[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is DetailNotice =>
        value === "resume-title" ||
        value === "missing-details" ||
        value === "self-email",
    );
  } catch {
    return [];
  }
}

function getStoredHighlight(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(key) !== "false";
  } catch {
    return true;
  }
}

function getServerTrue() {
  return true;
}

export const ApplicationDetailView: FC<ApplicationDetailViewProps> = ({
  application,
  locale,
  defaultTab = "details",
  viewerId = "",
  viewerEmail = "",
  matchAnalysis = null,
  resumeTitle = null,
  canCloseSearch = false,
}) => {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const utils = api.useUtils();

  const rightTabs = (() => {
    const timelineTabItem = {
      id: "timeline" as const,
      icon: Clock,
      labelKey: "detail.timelineTab" as const,
    };
    const tailorTabItem = {
      id: "tailor" as const,
      icon: Sparkles,
      labelKey: "detail.tailorTab" as const,
    };
    const emailTabItem = {
      id: "emails" as const,
      icon: MailOpen,
      labelKey: "detail.emailTab" as const,
    };
    return [tailorTabItem, timelineTabItem, emailTabItem];
  })();

  const [rightTab, setRightTab] = useState<RightPanelTab>(() => {
    if (
      defaultTab === "tailor" ||
      defaultTab === "timeline" ||
      defaultTab === "emails"
    ) {
      return defaultTab;
    }
    return "tailor";
  });
  const [mobileTab, setMobileTab] = useState<"details" | RightPanelTab>(() => {
    if (
      defaultTab === "tailor" ||
      defaultTab === "timeline" ||
      defaultTab === "emails"
    ) {
      return defaultTab;
    }
    return "details";
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCloseSearchOpen, setIsCloseSearchOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [resultEventId, setResultEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dateFnsLocale = getDateFnsLocale(locale);
  const notices = getApplicationDetailNotices(
    application,
    resumeTitle,
    viewerEmail,
  );
  const noticeStorageKey = `job-tracker:resolved-notices:${application.id}`;
  const storedNoticesRaw = useSyncExternalStore(
    subscribeStorage,
    () => getStoredNoticesRaw(noticeStorageKey),
    getServerEmptyString,
  );
  const storedNotices = useMemo(
    () => parseResolvedNotices(storedNoticesRaw),
    [storedNoticesRaw],
  );
  const [manuallyResolved, setManuallyResolved] = useState<DetailNotice[]>([]);
  const [prevNoticeKey, setPrevNoticeKey] = useState(noticeStorageKey);
  if (prevNoticeKey !== noticeStorageKey) {
    setPrevNoticeKey(noticeStorageKey);
    setManuallyResolved([]);
  }

  const resolvedNotices = useMemo(() => {
    return Array.from(new Set([...storedNotices, ...manuallyResolved]));
  }, [storedNotices, manuallyResolved]);

  const pendingNotices = notices.filter(
    (notice) => !resolvedNotices.includes(notice),
  );
  const resolveNotice = (notice: DetailNotice) => {
    setManuallyResolved((prev) =>
      prev.includes(notice) ? prev : [...prev, notice],
    );
    try {
      const next = Array.from(new Set([...resolvedNotices, notice]));
      sessionStorage.setItem(noticeStorageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  const deleteApplication = api.jobTrackerAdmin.deleteApplication.useMutation();
  const updateStatus =
    api.jobTrackerAdmin.updateApplicationStatus.useMutation();
  const snoozeGhost = api.jobTrackerAdmin.snoozeGhostNudge.useMutation();
  const closeSearch = api.jobTrackerAdmin.closeJobSearch.useMutation();
  const emailHistory = api.jobTrackerAdmin.getApplicationEmailHistory.useQuery({
    applicationId: application.id,
  });
  const companyEmails = (emailHistory.data ?? []).filter(
    (email) =>
      email.sentAt &&
      email.recipientKind !== "COPY" &&
      email.recipientEmail.trim().toLowerCase() !==
        viewerEmail.trim().toLowerCase(),
  );
  const pendingCount = application.events.filter(
    (event) => !event.completed,
  ).length;
  const emailCount =
    emailHistory.data?.length ?? application.emailSummary?.totalSent ?? 0;

  const selectTab = useCallback(
    (tab: "details" | RightPanelTab) => {
      setMobileTab(tab);
      if (tab !== "details") setRightTab(tab);
      router.replace(
        {
          pathname: "/admin/job-tracker/applications/[id]",
          params: { id: application.id },
          query: { tab },
        },
        { scroll: false },
      );
    },
    [application.id, router],
  );

  const changeStatus = useCallback(
    async (status: ApplicationDetail["status"]) => {
      try {
        await updateStatus.mutateAsync({ id: application.id, status });
        router.refresh();
      } catch {
        toast.error(t("detail.statusUpdateError"));
      }
    },
    [application.id, router, t, updateStatus],
  );

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
            <Select
              value={application.status}
              onValueChange={(value) => {
                if (value && value in STATUS_OPTIONS) {
                  void changeStatus(value);
                }
              }}
            >
              <SelectTrigger
                aria-label={t("detail.statusLabel")}
                disabled={updateStatus.isPending}
                className="h-8 w-auto min-w-32"
              >
                <SelectValue>{t(`status.${application.status}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STATUS_OPTIONS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status as ApplicationDetail["status"]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          role="toolbar"
          aria-label={t("detail.actionsGroup")}
          className="flex flex-wrap items-center gap-2"
        >
          {application.jobUrl ? (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="mr-1.5 size-3.5" aria-hidden />
              {t("detail.viewJobPosting")}
            </a>
          ) : null}
          <Button type="button" size="sm" onClick={() => setIsEmailOpen(true)}>
            <Mail className="mr-1.5 size-3.5" aria-hidden />
            {t("email.openButton")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t("detail.moreActions")}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push({
                    pathname: "/admin/job-tracker/applications/[id]/edit",
                    params: { id: application.id },
                  })
                }
              >
                <Pencil aria-hidden /> {t("detail.editApplicationButton")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onClick={() => setIsConfirmOpen(true)}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 aria-hidden />
                )}
                {t("detail.deleteApplicationButton")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ApplicationNextStepBanner
        application={application}
        hasSentCv={companyEmails.length > 0}
        onOpenEmail={() => setIsEmailOpen(true)}
        onOpenTimeline={() => selectTab("timeline")}
        onOpenTailor={() => selectTab("tailor")}
        onMarkRejected={() => void changeStatus("REJECTED")}
        onSnoozeGhost={() => {
          void snoozeGhost
            .mutateAsync({ ids: [application.id], days: 7 })
            .then(() => router.refresh())
            .catch(() => toast.error(t("nextStep.snoozeError")));
        }}
        onCloseSearch={
          canCloseSearch && application.status === "HIRED"
            ? () => setIsCloseSearchOpen(true)
            : undefined
        }
        pending={updateStatus.isPending || snoozeGhost.isPending}
        noticeCount={
          pendingNotices.length +
          Number(
            cleanImportedJobDescription(application.description) !==
              application.description.trim(),
          )
        }
        onCompleteEvent={setResultEventId}
      />

      <ApplicationProcessPath
        application={application}
        locale={locale}
        onCompleteEvent={setResultEventId}
      />

      {/* Mobile application sections */}
      <div className="flex flex-col gap-4 lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(value) =>
            selectTab(value as "details" | RightPanelTab)
          }
        >
          <nav aria-label={t("detail.tabsNavAria")}>
            <TabsList variant="line" className="w-full overflow-x-auto">
              <TabsTrigger value="details" className="flex-1 text-xs">
                <FileText aria-hidden />
                {t("detail.detailsTab")}
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1 text-xs">
                <Clock aria-hidden />
                {t("detail.timelineTab")}
                {pendingCount > 0 ? (
                  <span
                    aria-hidden
                    className="bg-primary/10 rounded-full px-1.5"
                  >
                    {pendingCount}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex-1 text-xs">
                <MailOpen aria-hidden />
                {t("detail.emailTab")}
                {emailCount > 0 ? (
                  <span
                    aria-hidden
                    className="bg-primary/10 rounded-full px-1.5"
                  >
                    {emailCount}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="tailor" className="flex-1 text-xs">
                <Sparkles aria-hidden />
                {t("detail.tailorTab")}
              </TabsTrigger>
            </TabsList>
          </nav>
        </Tabs>

        {mobileTab === "details" && (
          <ApplicationDetailsPanel
            application={application}
            appliedLabel={appliedLabel}
            onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
            onOpenTailor={() => selectTab("tailor")}
            viewerId={viewerId}
            matchAnalysis={matchAnalysis}
            notices={pendingNotices}
            onResolveNotice={resolveNotice}
            t={t}
          />
        )}

        {mobileTab === "timeline" && (
          <section className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5">
            <ApplicationTimeline
              application={application}
              locale={locale}
              variant="embedded"
              activityHint={t("detail.timelineActivityHint")}
              onCompleteEvent={setResultEventId}
              sentEmails={companyEmails}
            />
          </section>
        )}

        {mobileTab === "emails" && (
          <section className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5">
            <ApplicationEmailHistory
              applicationId={application.id}
              locale={locale}
              viewerEmail={viewerEmail}
              onOpenEmail={() => setIsEmailOpen(true)}
            />
          </section>
        )}

        {mobileTab === "tailor" && (
          <section className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5">
            <ResumeTailorWorkflow
              key={application.cvFile?.url ?? application.id}
              applicationId={application.id}
              embedded
              existingCvFile={application.cvFile}
              onSendCv={() => setIsEmailOpen(true)}
            />
          </section>
        )}
      </div>

      <div className="hidden items-start gap-4 lg:grid lg:grid-cols-[minmax(21.25rem,5fr)_7fr]">
        <div className="sticky top-4 max-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto">
          <ApplicationDetailsPanel
            application={application}
            appliedLabel={appliedLabel}
            onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
            onOpenTailor={() => selectTab("tailor")}
            viewerId={viewerId}
            matchAnalysis={matchAnalysis}
            notices={pendingNotices}
            onResolveNotice={resolveNotice}
            t={t}
          />
        </div>

        <div className="min-w-0">
          <ApplicationWorkspacePanel
            application={application}
            locale={locale}
            rightTab={rightTab}
            setRightTab={(tab) => selectTab(tab)}
            rightTabs={rightTabs}
            onCompleteEvent={setResultEventId}
            sentEmails={companyEmails}
            viewerEmail={viewerEmail}
            onOpenEmail={() => setIsEmailOpen(true)}
            pendingCount={pendingCount}
            emailCount={emailCount}
            t={t}
          />
        </div>
      </div>

      <ApplicationEmailDialog
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        applicationId={application.id}
        hasCvFile={Boolean(application.cvFile?.url)}
        cvFileName={application.cvFile?.name}
        locale={locale}
        viewerEmail={viewerEmail}
      />

      <ApplicationCoverLetterDialog
        open={isCoverLetterOpen}
        onOpenChange={setIsCoverLetterOpen}
        applicationId={application.id}
        initialSubject={application.coverLetterSubject}
        initialBody={application.coverLetterBody}
      />

      <ApplicationEventResultDialog
        applicationId={application.id}
        eventId={resultEventId}
        onClose={() => setResultEventId(null)}
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
      <ConfirmDialog
        open={isCloseSearchOpen}
        onOpenChange={setIsCloseSearchOpen}
        title={t("nextStep.closeSearch")}
        description={t("nextStep.closeSearchConfirm")}
        cancelLabel={t("detail.deleteCancel")}
        confirmLabel={t("nextStep.closeSearch")}
        isPending={closeSearch.isPending}
        onConfirm={() => {
          void closeSearch
            .mutateAsync({
              outcome: "HIRED",
              hiredApplicationId: application.id,
            })
            .then(() => {
              setIsCloseSearchOpen(false);
              router.refresh();
            })
            .catch(() => toast.error(t("nextStep.closeSearchError")));
        }}
      />
    </div>
  );
};

function ApplicationDetailsPanel({
  application,
  appliedLabel,
  onOpenCoverLetter,
  onOpenTailor,
  viewerId,
  matchAnalysis,
  notices,
  onResolveNotice,
  t,
}: {
  application: ApplicationDetail;
  appliedLabel: string;
  onOpenCoverLetter: () => void;
  onOpenTailor: () => void;
  viewerId: string;
  matchAnalysis: CvMatchAnalysis | null;
  notices: DetailNotice[];
  onResolveNotice: (notice: DetailNotice) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}) {
  const router = useRouter();
  const updateApplication = api.jobTrackerAdmin.updateApplication.useMutation();
  const cleanedDescription = cleanImportedJobDescription(
    application.description,
  );

  const cleanDescription = async () => {
    try {
      await updateApplication.mutateAsync({
        id: application.id,
        description: cleanedDescription,
      });
      router.refresh();
    } catch {
      toast.error(t("detail.cleanError"));
    }
  };

  return (
    <section className="border-border bg-card space-y-5 rounded-xl border p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold">{t("detail.vacancyTitle")}</h2>
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
        {application.jobUrl ? (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t("detail.jobUrl")}
            </dt>
            <dd className="text-foreground mt-1 text-sm">
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex max-w-full items-center gap-1.5 hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{application.jobUrl}</span>
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <ApplicationDetailNotices
        application={application}
        notices={notices.filter((notice) => notice !== "self-email")}
        onResolveNotice={onResolveNotice}
        onOpenTailor={onOpenTailor}
        t={t}
      />

      <div className="border-border border-t pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground size-4" aria-hidden />
            <h2 className="text-sm font-semibold">{t("detail.companyInfo")}</h2>
          </div>
          <Link
            href={{
              pathname: "/admin/job-tracker/companies/[id]/edit",
              params: { id: application.company.id },
            }}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            {t("detail.editCompany")}
          </Link>
        </div>
        <div className="bg-muted/40 space-y-2 rounded-lg p-3.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-foreground font-medium">
              {application.company.name}
            </span>
            <div className="flex items-center gap-3 text-xs">
              {application.company.website ? (
                <a
                  href={application.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <Globe className="size-3" aria-hidden />
                  {t("websiteLink")}
                </a>
              ) : null}
              {application.company.linkedinUrl ? (
                <a
                  href={application.company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <LinkedinIcon className="size-3" aria-hidden />
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>
          {application.company.location ? (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span>{application.company.location}</span>
            </div>
          ) : null}
          {application.company.email ? (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Mail className="size-3 shrink-0" aria-hidden />
              <a
                href={`mailto:${application.company.email}`}
                className="hover:underline"
              >
                {application.company.email}
              </a>
            </div>
          ) : null}
          {application.company.description ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {application.company.description}
            </p>
          ) : null}
        </div>
      </div>

      <ApplicationDetailNotices
        application={application}
        notices={notices.filter((notice) => notice === "self-email")}
        onResolveNotice={onResolveNotice}
        onOpenTailor={onOpenTailor}
        t={t}
      />

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
            onClick={onOpenCoverLetter}
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
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-4" aria-hidden />
            <h2 className="text-sm font-semibold">
              {t("detail.jobDescription")}
            </h2>
          </div>
          {cleanedDescription !== application.description.trim() ? (
            <Button
              size="sm"
              variant="outline"
              disabled={updateApplication.isPending}
              onClick={() => void cleanDescription()}
            >
              {t("detail.cleanText")}
            </Button>
          ) : null}
        </header>
        {cleanedDescription !== application.description.trim() ? (
          <p className="border-border bg-muted text-foreground rounded-lg border p-3 text-sm">
            {t("detail.importArtifacts")}
          </p>
        ) : null}
        <CollapsibleJobDescription
          description={application.description}
          analysis={matchAnalysis}
          viewerId={viewerId}
          t={t}
          emptyLabel={t("detail.noDescription")}
          showMoreLabel={t("detail.showFullDescription")}
          showLessLabel={t("detail.hideFullDescription")}
        />
      </div>
    </section>
  );
}

function ApplicationDetailNotices({
  application,
  notices,
  onOpenTailor,
  onResolveNotice,
  t,
}: {
  application: ApplicationDetail;
  notices: DetailNotice[];
  onOpenTailor: () => void;
  onResolveNotice: (notice: DetailNotice) => void;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}) {
  if (notices.length === 0) return null;

  return (
    <div className="space-y-2" aria-label={t("detail.noticesTitle")}>
      {notices.map((notice) => (
        <div
          key={notice}
          className="border-border bg-muted text-foreground flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <p className="min-w-0 flex-1 text-sm">
            {t(`detail.notice.${notice}`)}
          </p>
          <div className="flex items-center gap-2">
            {notice === "resume-title" ? (
              <Button size="sm" variant="outline" onClick={onOpenTailor}>
                {t("detail.review")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link
                    href={
                      notice === "self-email"
                        ? {
                            pathname: "/admin/job-tracker/companies/[id]/edit",
                            params: { id: application.company.id },
                          }
                        : {
                            pathname:
                              "/admin/job-tracker/applications/[id]/edit",
                            params: { id: application.id },
                          }
                    }
                  />
                }
              >
                {t("detail.review")}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResolveNotice(notice)}
            >
              {t("detail.resolved")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApplicationWorkspacePanel({
  application,
  locale,
  rightTab,
  setRightTab,
  rightTabs,
  onCompleteEvent,
  sentEmails,
  viewerEmail,
  onOpenEmail,
  pendingCount,
  emailCount,
  t,
}: {
  application: ApplicationDetail;
  locale: Locale;
  rightTab: RightPanelTab;
  setRightTab: (tab: RightPanelTab) => void;
  rightTabs: {
    id: RightPanelTab;
    icon: typeof Clock;
    labelKey: "detail.timelineTab" | "detail.tailorTab" | "detail.emailTab";
  }[];
  onCompleteEvent: (eventId: string) => void;
  sentEmails: {
    id: string;
    recipientEmail: string;
    sentAt: Date | null;
    subject: string;
  }[];
  viewerEmail: string;
  onOpenEmail: () => void;
  pendingCount: number;
  emailCount: number;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
}) {
  return (
    <section className="border-border bg-card flex min-h-[36rem] flex-col rounded-xl border shadow-sm">
      <Tabs
        value={rightTab}
        onValueChange={(value) => setRightTab(value as RightPanelTab)}
      >
        <nav aria-label={t("detail.tabsNavAria")}>
          <TabsList
            variant="line"
            className="border-border w-full overflow-x-auto border-b"
          >
            {rightTabs.map(({ id, icon: Icon, labelKey }) => (
              <TabsTrigger key={id} value={id}>
                <Icon className="size-4" aria-hidden />
                {t(labelKey)}
                {id === "timeline" && pendingCount > 0 ? (
                  <span
                    aria-hidden
                    className="bg-primary/10 rounded-full px-1.5 text-xs"
                  >
                    {pendingCount}
                  </span>
                ) : null}
                {id === "emails" && emailCount > 0 ? (
                  <span
                    aria-hidden
                    className="bg-primary/10 rounded-full px-1.5 text-xs"
                  >
                    {emailCount}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </nav>
      </Tabs>

      <div className="relative min-h-0 flex-1">
        <div role="tabpanel" className="p-4 sm:p-5">
          {rightTab === "timeline" ? (
            <ApplicationTimeline
              application={application}
              locale={locale}
              variant="embedded"
              activityHint={t("detail.timelineActivityHint")}
              onCompleteEvent={onCompleteEvent}
              sentEmails={sentEmails}
            />
          ) : rightTab === "emails" ? (
            <ApplicationEmailHistory
              applicationId={application.id}
              locale={locale}
              viewerEmail={viewerEmail}
              onOpenEmail={onOpenEmail}
            />
          ) : (
            <ResumeTailorWorkflow
              key={application.cvFile?.url ?? application.id}
              applicationId={application.id}
              embedded
              existingCvFile={application.cvFile}
              onSendCv={onOpenEmail}
            />
          )}
        </div>
      </div>
    </section>
  );
}

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
  analysis,
  viewerId,
  t,
  emptyLabel,
  showMoreLabel,
  showLessLabel,
}: {
  description: string;
  analysis: CvMatchAnalysis | null;
  viewerId: string;
  t: ReturnType<typeof useTranslations<"admin.jobTracker">>;
  emptyLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const trimmed = description.trim();
  const [expanded, setExpanded] = useState(true);
  const preferenceKey = `job-tracker:highlight:${viewerId}`;
  const [userHighlighted, setUserHighlighted] = useState<boolean | null>(null);
  const [prevViewerId, setPrevViewerId] = useState(viewerId);
  if (prevViewerId !== viewerId) {
    setPrevViewerId(viewerId);
    setUserHighlighted(null);
  }
  const storedHighlighted = useSyncExternalStore(
    subscribeStorage,
    () => getStoredHighlight(preferenceKey),
    getServerTrue,
  );
  const highlighted = userHighlighted ?? storedHighlighted;
  const canCollapse = trimmed.length > DESCRIPTION_COLLAPSE_CHARS;
  const parts = highlighted
    ? splitHighlightedDescription(trimmed, analysis)
    : [{ text: trimmed }];

  if (!trimmed) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <div>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={highlighted}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setUserHighlighted(next);
            try {
              localStorage.setItem(preferenceKey, String(next));
            } catch {
              // ignore
            }
          }}
        />
        {t("detail.highlightMatches")}
      </label>
      {highlighted ? (
        <p className="text-muted-foreground mb-2 text-xs">
          {t("detail.legend.present")} · {t("detail.legend.partial")}
          {analysis ? ` · ${t("detail.legend.missing")}` : null}
        </p>
      ) : null}
      <div
        className={cn(
          "text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap",
          !expanded && canCollapse && "max-h-40 overflow-hidden",
        )}
      >
        {parts.map((part, index) =>
          part.status ? (
            <mark
              key={index}
              title={t(`detail.legend.${part.status}`)}
              className={cn(
                "rounded-sm px-0.5 underline decoration-dashed underline-offset-2",
                part.status === "present" && "bg-primary/15 text-foreground",
                part.status === "partial" && "bg-warning/15 text-foreground",
                part.status === "missing" &&
                  "bg-destructive/15 text-foreground decoration-wavy",
              )}
            >
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
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
