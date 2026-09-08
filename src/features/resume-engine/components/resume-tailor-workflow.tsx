"use client";

import type { FC, ReactNode } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import { ResumeDocxUpload } from "@/features/resume-engine/components/resume-docx-upload";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";
import { ResumeTailorPreviewPanel } from "@/features/resume-engine/components/resume-tailor-preview-panel";
import {
  parseMatchAnalysis,
  type CvMatchAnalysis,
} from "@/features/resume-engine/lib/cv-match-analysis";

type SourceType = "studio" | "upload";
type Step = "configure" | "tailoring" | "done";

interface ExistingCvFile {
  name: string;
  url: string;
  uploadedAt: Date;
}

interface ResumeTailorWorkflowProps {
  applicationId?: string;
  embedded?: boolean;
  existingCvFile?: ExistingCvFile;
}

export const ResumeTailorWorkflow: FC<ResumeTailorWorkflowProps> = ({
  applicationId,
  embedded = false,
  existingCvFile,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [step, setStep] = useState<Step>("configure");
  const [sourceType, setSourceType] = useState<SourceType>("studio");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [matchNotes, setMatchNotes] = useState<string | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<CvMatchAnalysis | null>(
    null,
  );
  const [structuredSnapshot, setStructuredSnapshot] = useState<unknown>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AiProcessingMode>("auto");
  const [provider, setProvider] = useState<AiProviderName | null>(null);
  const [manualTailorJson, setManualTailorJson] = useState("");
  const [showTailorForm, setShowTailorForm] = useState(() => !existingCvFile);
  const [showReplaceFile, setShowReplaceFile] = useState(false);
  const [appliedExportId, setAppliedExportId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const aiSettings = api.resumeEngineAdmin.getAiSettings.useQuery();
  const pageData = api.resumeEngineAdmin.getTailorPageData.useQuery({
    applicationId,
  });
  const tailorPrompt = api.resumeEngineAdmin.getTailorPrompt.useQuery(
    {
      sourceType,
      uploadId: uploadId ?? undefined,
      applicationId,
      jobDescription:
        jobDescription.trim().length > 0
          ? jobDescription.trim()
          : (pageData.data?.application?.description?.trim() ?? "placeholder"),
    },
    { enabled: false },
  );

  const registerUpload = api.resumeEngineAdmin.registerUpload.useMutation();
  const tailorResume = api.resumeEngineAdmin.tailorResume.useMutation();
  const tailorResumeManual =
    api.resumeEngineAdmin.tailorResumeManual.useMutation();
  const replacePolishedResume =
    api.resumeEngineAdmin.replacePolishedResume.useMutation();
  const utils = api.useUtils();

  const application = pageData.data?.application;
  const latestExport = pageData.data?.latestExport;
  const hasStudioData = pageData.data?.hasStudioData ?? false;
  const uploads = pageData.data?.uploads ?? [];
  const hasAutoProviders = aiSettings.data?.hasAutoProviders ?? false;
  const providers = aiSettings.data?.providers ?? [];
  const defaultProvider = aiSettings.data?.defaultProvider ?? null;

  const trimmedJobDescription = jobDescription.trim();
  const applicationDescription = application?.description?.trim() ?? "";
  const effectiveJobDescription =
    trimmedJobDescription.length > 0
      ? trimmedJobDescription
      : applicationDescription;

  const effectiveMode: AiProcessingMode =
    aiSettings.data && !hasAutoProviders ? "manual" : mode;
  const effectiveProvider = provider ?? defaultProvider;

  if (!showTailorForm && latestExport && appliedExportId !== latestExport.id) {
    const analysis = parseMatchAnalysis(latestExport.matchAnalysis);
    setAppliedExportId(latestExport.id);
    setExportId(latestExport.id);
    setDownloadUrl(latestExport.fileUrl);
    setPdfDownloadUrl(latestExport.pdfFileUrl ?? null);
    setStructuredSnapshot(latestExport.structuredSnapshot ?? null);
    setAiScore(latestExport.aiScore ?? null);
    setMatchNotes(analysis?.notes ?? null);
    setMatchAnalysis(analysis);
    setStep("done");
  }

  const applyTailorResult = useCallback(
    (result: {
      downloadUrl: string;
      exportId?: string;
      aiScore: number | null;
      matchNotes?: string | null;
      matchAnalysis?: unknown;
      structuredSnapshot?: unknown;
      pdfDownloadUrl?: string | null;
    }) => {
      setDownloadUrl(result.downloadUrl);
      setExportId(result.exportId ?? null);
      setAiScore(result.aiScore);
      setMatchNotes(result.matchNotes ?? null);
      setMatchAnalysis(parseMatchAnalysis(result.matchAnalysis));
      setStructuredSnapshot(result.structuredSnapshot ?? null);
      setPdfDownloadUrl(result.pdfDownloadUrl ?? null);
      if (result.exportId) setAppliedExportId(result.exportId);
    },
    [],
  );

  const handleTailorAuto = useCallback(() => {
    if (effectiveJobDescription.length < 20) {
      setError(t("tailorJdTooShort"));
      return;
    }
    if (sourceType === "studio" && !hasStudioData) {
      setError(t("tailorNoStudioData"));
      return;
    }
    if (sourceType === "upload" && !uploadId) {
      setError(t("tailorNoUpload"));
      return;
    }

    startTransition(async () => {
      setError(null);
      setStep("tailoring");
      try {
        const result = await tailorResume.mutateAsync({
          sourceType,
          uploadId: uploadId ?? undefined,
          jobDescription: effectiveJobDescription,
          applicationId,
          provider: effectiveProvider ?? undefined,
        });
        applyTailorResult(result);
        setStep("done");
        toast.success(t("tailorSuccess"));
      } catch (err) {
        const message = err instanceof Error ? err.message : t("tailorFailed");
        setError(message);
        setStep("configure");
        toast.error(t("tailorFailed"), { description: message });
      }
    });
  }, [
    applicationId,
    effectiveJobDescription,
    effectiveProvider,
    hasStudioData,
    sourceType,
    tailorResume,
    applyTailorResult,
    t,
    uploadId,
  ]);

  const handleTailorManual = useCallback(() => {
    if (effectiveJobDescription.length < 20) {
      setError(t("tailorJdTooShort"));
      return;
    }
    if (sourceType === "studio" && !hasStudioData) {
      setError(t("tailorNoStudioData"));
      return;
    }
    if (sourceType === "upload" && !uploadId) {
      setError(t("tailorNoUpload"));
      return;
    }

    startTransition(async () => {
      setError(null);
      setStep("tailoring");
      try {
        const result = await tailorResumeManual.mutateAsync({
          sourceType,
          uploadId: uploadId ?? undefined,
          jobDescription: effectiveJobDescription,
          applicationId,
          rawJson: manualTailorJson,
        });
        applyTailorResult(result);
        setStep("done");
        toast.success(t("tailorSuccess"));
      } catch (err) {
        const message = err instanceof Error ? err.message : t("tailorFailed");
        setError(message);
        setStep("configure");
        toast.error(t("tailorFailed"), { description: message });
      }
    });
  }, [
    applicationId,
    effectiveJobDescription,
    hasStudioData,
    manualTailorJson,
    sourceType,
    tailorResumeManual,
    applyTailorResult,
    t,
    uploadId,
  ]);

  const handleUploadComplete = useCallback(
    (file: { url: string; key: string; name: string; mimeType?: string }) => {
      startTransition(async () => {
        setError(null);
        try {
          const registered = await registerUpload.mutateAsync({
            originalFileUrl: file.url,
            uploadThingKey: file.key,
            fileName: file.name,
            mimeType:
              file.mimeType && file.mimeType.length > 0
                ? file.mimeType
                : file.name.toLowerCase().endsWith(".pdf")
                  ? "application/pdf"
                  : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          setUploadId(registered.id);
          toast.success(t("tailorUploadReady"));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("uploadFailed");
          setError(message);
          toast.error(t("uploadFailed"), { description: message });
        }
      });
    },
    [registerUpload, t],
  );

  const handleLoadTailorPrompt = useCallback(async () => {
    if (effectiveJobDescription.length < 20) {
      setError(t("tailorJdTooShort"));
      return null;
    }
    const result = await tailorPrompt.refetch();
    return result.data ?? null;
  }, [effectiveJobDescription.length, t, tailorPrompt]);

  const handlePolishedUpload = useCallback(
    (file: { url: string; key: string; name: string; mimeType: string }) => {
      startTransition(async () => {
        try {
          const result = await replacePolishedResume.mutateAsync({
            exportId: exportId ?? undefined,
            applicationId,
            originalFileUrl: file.url,
            uploadThingKey: file.key,
            fileName: file.name,
            mimeType: file.mimeType,
          });
          setExportId(result.exportId);
          setDownloadUrl(result.downloadUrl);
          setPdfDownloadUrl(result.pdfDownloadUrl ?? null);
          setShowReplaceFile(false);
          toast.success(
            result.kind === "pdf"
              ? t("polishPdfSuccess")
              : t("polishDocxSuccess"),
          );
          void utils.resumeEngineAdmin.getTailorPageData.invalidate();
          if (applicationId) {
            void utils.jobTrackerAdmin.getApplicationById.invalidate({
              id: applicationId,
            });
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("polishUploadFailed");
          toast.error(t("polishUploadFailed"), { description: message });
        }
      });
    },
    [
      applicationId,
      exportId,
      replacePolishedResume,
      t,
      utils.jobTrackerAdmin.getApplicationById,
      utils.resumeEngineAdmin.getTailorPageData,
    ],
  );

  const renderPolishUpload = () => {
    if (!exportId && !applicationId) return null;
    if (!showReplaceFile) {
      return (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowReplaceFile(true)}
        >
          <Upload className="size-3.5" aria-hidden />
          {t("polishReplaceCta")}
        </Button>
      );
    }
    return (
      <div className="rounded-md border p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-xs font-medium">{t("polishUploadTitle")}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto px-0 text-xs"
            onClick={() => setShowReplaceFile(false)}
          >
            {t("polishReplaceCancel")}
          </Button>
        </div>
        <p className="text-muted-foreground mb-3 text-xs">
          {t("polishUploadHint")}
        </p>
        <ResumeDocxUpload
          allowPdf
          preferPdf
          resetKey={downloadUrl ?? exportId ?? "polish"}
          onUploaded={handlePolishedUpload}
          onError={(message) => {
            toast.error(t("polishUploadFailed"), { description: message });
          }}
        />
      </div>
    );
  };

  const previewFileUrl = downloadUrl ?? existingCvFile?.url ?? "";

  const renderPreviewPanel = (actions?: ReactNode) => (
    <ResumeTailorPreviewPanel
      fileUrl={previewFileUrl}
      fileName={latestExport?.fileName ?? existingCvFile?.name}
      mimeType={latestExport?.mimeType}
      structuredSnapshot={structuredSnapshot}
      downloadUrl={downloadUrl}
      pdfDownloadUrl={pdfDownloadUrl}
      aiScore={aiScore}
      matchNotes={matchNotes}
      matchAnalysis={matchAnalysis}
      actions={
        <>
          {actions}
          {!showReplaceFile ? renderPolishUpload() : null}
        </>
      }
      belowToolbar={showReplaceFile ? renderPolishUpload() : null}
    />
  );

  const renderTailorExtras = (actions?: ReactNode) => (
    <div className="mt-3">{renderPreviewPanel(actions)}</div>
  );

  const handleResetTailor = useCallback(() => {
    setStep("configure");
    setDownloadUrl(null);
    setExportId(null);
    setAiScore(null);
    setMatchNotes(null);
    setMatchAnalysis(null);
    setStructuredSnapshot(null);
    setPdfDownloadUrl(null);
    setManualTailorJson("");
    setError(null);
    setShowTailorForm(true);
  }, []);

  const showExistingBanner =
    Boolean(existingCvFile) && !showTailorForm && step === "configure";

  const renderExistingBanner = () =>
    existingCvFile ? (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className="text-primary mt-0.5 size-4.5 shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-primary text-sm font-medium">
              {t("tailorAlreadyDone")}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t("tailorGeneratedOn", {
                date: new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                }).format(new Date(existingCvFile.uploadedAt)),
              })}
            </p>
          </div>
        </div>
        {renderTailorExtras(
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleResetTailor}
          >
            {t("tailorRegenerate")}
          </Button>,
        )}
      </div>
    ) : null;

  const handleSwitchToManual = useCallback(() => {
    setMode("manual");
    setError(null);
  }, []);

  const sourceOptionClass = (active: boolean, disabled = false) =>
    cn(
      "flex flex-col gap-0.5 rounded-md border p-2.5 text-left transition-colors",
      active
        ? "border-primary bg-primary/5"
        : "border-border bg-background hover:bg-muted/50",
      disabled && "cursor-not-allowed opacity-50",
    );

  const renderSourceSection = (compact: boolean) => (
    <div className={compact ? "mb-5" : "flex flex-col gap-4"}>
      {compact ? (
        <p className="mb-2 text-sm font-medium">{t("tailorSourceTitle")}</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => setSourceType("studio")}
          disabled={!hasStudioData}
          className={sourceOptionClass(sourceType === "studio", !hasStudioData)}
        >
          <span
            className={cn(
              "font-medium",
              compact ? "text-[13px]" : "text-sm",
              sourceType === "studio" && compact && "text-primary",
            )}
          >
            {t("tailorSourceStudio")}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {hasStudioData && pageData.data?.studioPreview
              ? t("tailorSourceStudioHint", {
                  name: pageData.data.studioPreview.fullName,
                  count: pageData.data.studioPreview.experienceCount,
                })
              : t("tailorSourceStudioEmpty")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSourceType("upload")}
          className={sourceOptionClass(sourceType === "upload")}
        >
          <span
            className={cn(
              "font-medium",
              compact ? "text-[13px]" : "text-sm",
              sourceType === "upload" && compact && "text-primary",
            )}
          >
            {t("tailorSourceUpload")}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {t("tailorSourceUploadHint")}
          </span>
        </button>
      </div>

      {sourceType === "upload" ? (
        <div className="mt-3 flex flex-col gap-3">
          {uploads.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>{t("tailorRecentUploads")}</Label>
              <div className="flex flex-wrap gap-2">
                {uploads.map((upload) => (
                  <Button
                    key={upload.id}
                    type="button"
                    size="sm"
                    variant={uploadId === upload.id ? "default" : "outline"}
                    onClick={() => setUploadId(upload.id)}
                  >
                    {upload.fileName}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <ResumeDocxUpload
            allowPdf
            resetKey={uploadId ?? "new"}
            onUploaded={(file) => {
              void handleUploadComplete(file);
            }}
            onError={(message) => {
              setError(message);
              toast.error(t("uploadFailed"), { description: message });
            }}
          />
        </div>
      ) : null}
    </div>
  );

  const renderErrorPanel = () =>
    error ? (
      <div
        className="border-destructive/30 bg-destructive/5 mt-4 rounded-lg border p-3.5"
        role="alert"
      >
        <div className="flex gap-2">
          <AlertTriangle
            className="text-destructive mt-0.5 size-[18px] shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-destructive text-[13px] font-medium">
              {t("tailorFailed")}
            </p>
            <p className="text-muted-foreground mt-1 text-[13px]">{error}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={
                  effectiveMode === "manual"
                    ? handleTailorManual
                    : handleTailorAuto
                }
              >
                <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
                {t("tailorErrorRetry")}
              </Button>
              {effectiveMode === "auto" && hasAutoProviders ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                >
                  {t("tailorErrorSwitchProvider")}
                </Button>
              ) : null}
              {hasAutoProviders ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToManual}
                >
                  {t("tailorErrorUseManual")}
                </Button>
              ) : null}
            </div>
            <details className="mt-2">
              <summary className="text-muted-foreground cursor-pointer text-[11px]">
                {t("tailorTechnicalDetails")}
              </summary>
              <p className="text-muted-foreground mt-1.5 font-mono text-[11px] break-all">
                {error}
              </p>
            </details>
          </div>
        </div>
      </div>
    ) : null;

  const renderSuccessPanel = () =>
    step === "done" && downloadUrl ? (
      <div className="mt-4">
        {renderTailorExtras(
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetTailor}
          >
            {t("tailorRegenerate")}
          </Button>,
        )}
      </div>
    ) : null;

  const renderConfigureForm = (compact: boolean) => (
    <>
      {renderSourceSection(compact)}

      <div className={compact ? "mb-5" : undefined}>
        {aiSettings.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t("aiSettingsLoading")}
          </div>
        ) : (
          <ResumeAiControls
            mode={effectiveMode}
            onModeChange={setMode}
            provider={provider}
            onProviderChange={setProvider}
            providers={providers}
            defaultProvider={defaultProvider}
            hasAutoProviders={hasAutoProviders}
            layout={compact ? "compact" : "default"}
          />
        )}
      </div>

      {effectiveMode === "manual" ? (
        <div className={compact ? "mb-5" : undefined}>
          <ManualAiPanel
            promptPackage={tailorPrompt.data}
            isLoadingPrompt={tailorPrompt.isFetching}
            onLoadPrompt={handleLoadTailorPrompt}
            rawJson={manualTailorJson}
            onRawJsonChange={setManualTailorJson}
            onSubmit={handleTailorManual}
            isPending={isPending}
            submitLabel={t("tailorCta")}
            canLoadPrompt={
              effectiveJobDescription.length >= 20 &&
              (sourceType === "studio" ? hasStudioData : Boolean(uploadId))
            }
            variant={compact ? "compact" : "default"}
            hideSubmit={compact}
          />
        </div>
      ) : null}

      {!compact ? (
        <Textarea
          value={
            jobDescription.length > 0
              ? jobDescription
              : (application?.description ?? "")
          }
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t("tailorJdPlaceholder")}
          rows={10}
          className="resize-y"
        />
      ) : null}

      <Button
        type="button"
        className={cn(
          "mt-5",
          compact ? "w-full sm:w-auto sm:min-w-[200px]" : "self-start",
        )}
        disabled={isPending || step !== "configure"}
        onClick={
          effectiveMode === "manual" ? handleTailorManual : handleTailorAuto
        }
      >
        {isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 size-4" aria-hidden />
        )}
        {t("tailorCta")}
      </Button>

      {renderErrorPanel()}
    </>
  );

  if (pageData.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("tailorLoading")}
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="w-full">
        {step === "tailoring" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="text-primary size-8 animate-spin" />
            <p className="text-sm font-medium">{t("tailoringTitle")}</p>
            <p className="text-muted-foreground text-center text-xs">
              {t("tailoringDescription")}
            </p>
          </div>
        ) : step === "done" && downloadUrl ? (
          renderSuccessPanel()
        ) : showExistingBanner ? (
          renderExistingBanner()
        ) : (
          <>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("tailorPageDescription")}
            </p>
            {renderConfigureForm(true)}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {!embedded && application ? (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base">
              {t("tailorForApplication")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {application.position} — {application.companyName}
          </CardContent>
        </Card>
      ) : null}

      {step === "configure" && (
        <>
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-base">
                {t("aiSettingsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiSettings.isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  {t("aiSettingsLoading")}
                </div>
              ) : (
                <ResumeAiControls
                  mode={effectiveMode}
                  onModeChange={setMode}
                  provider={provider}
                  onProviderChange={setProvider}
                  providers={providers}
                  defaultProvider={defaultProvider}
                  hasAutoProviders={hasAutoProviders}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {t("tailorSourceTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderSourceSection(false)}</CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                {t("tailorJdTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={
                  jobDescription.length > 0
                    ? jobDescription
                    : (application?.description ?? "")
                }
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t("tailorJdPlaceholder")}
                rows={10}
                className="resize-y"
              />

              {effectiveMode === "manual" ? (
                <ManualAiPanel
                  promptPackage={tailorPrompt.data}
                  isLoadingPrompt={tailorPrompt.isFetching}
                  onLoadPrompt={handleLoadTailorPrompt}
                  rawJson={manualTailorJson}
                  onRawJsonChange={setManualTailorJson}
                  onSubmit={handleTailorManual}
                  isPending={isPending}
                  submitLabel={t("tailorCta")}
                  canLoadPrompt={
                    effectiveJobDescription.length >= 20 &&
                    (sourceType === "studio"
                      ? hasStudioData
                      : Boolean(uploadId))
                  }
                />
              ) : (
                <Button
                  type="button"
                  onClick={handleTailorAuto}
                  disabled={isPending}
                  className="self-start"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {t("tailorCta")}
                </Button>
              )}

              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}

      {step === "tailoring" && (
        <Card className="bg-card text-card-foreground">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <p className="font-medium">{t("tailoringTitle")}</p>
            <p className="text-muted-foreground text-center text-sm">
              {t("tailoringDescription")}
            </p>
          </CardContent>
        </Card>
      )}

      {step === "done" && downloadUrl && (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="text-primary h-5 w-5" />
              {t("tailorDoneTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {renderTailorExtras(
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetTailor}
                >
                  <Upload className="mr-1.5 size-3.5" aria-hidden />
                  {t("tailorAgain")}
                </Button>
                {applicationId && !embedded ? (
                  <Link
                    href={{
                      pathname: "/admin/job-tracker/applications/[id]",
                      params: { id: applicationId },
                    }}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {t("tailorBackToApplication")}
                  </Link>
                ) : null}
              </>,
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
