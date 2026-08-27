"use client";

import type { FC } from "react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
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
import { OfficeDocumentPreview } from "@/components/shared/office-document-preview";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import { ResumeDocxUpload } from "@/features/resume-engine/components/resume-docx-upload";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

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
  /** When true, Office preview starts expanded (detail split view). */
  previewDefaultOpen?: boolean;
}

export const ResumeTailorWorkflow: FC<ResumeTailorWorkflowProps> = ({
  applicationId,
  embedded = false,
  existingCvFile,
  previewDefaultOpen = false,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [step, setStep] = useState<Step>("configure");
  const [sourceType, setSourceType] = useState<SourceType>("studio");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [matchNotes, setMatchNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AiProcessingMode>("auto");
  const [provider, setProvider] = useState<AiProviderName | null>(null);
  const [manualTailorJson, setManualTailorJson] = useState("");
  const [showTailorForm, setShowTailorForm] = useState(() => !existingCvFile);
  const [isPending, startTransition] = useTransition();

  const aiSettings = api.resumeEngineAdmin.getAiSettings.useQuery();
  const pageData = api.resumeEngineAdmin.getTailorPageData.useQuery({
    applicationId,
  });
  const tailorPrompt = api.resumeEngineAdmin.getTailorPrompt.useQuery(
    {
      sourceType,
      uploadId: uploadId ?? undefined,
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

  const application = pageData.data?.application;
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

  const matchNoteItems = useMemo(
    () =>
      matchNotes
        ?.split(/\n+/)
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean) ?? [],
    [matchNotes],
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
        setDownloadUrl(result.downloadUrl);
        setAiScore(result.aiScore);
        setMatchNotes(result.matchNotes ?? null);
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
        setDownloadUrl(result.downloadUrl);
        setAiScore(result.aiScore);
        setMatchNotes(result.matchNotes ?? null);
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
    t,
    uploadId,
  ]);

  const handleUploadComplete = useCallback(
    (files: { url: string; key: string; name: string }[]) => {
      const file = files[0];
      if (!file) return;

      startTransition(async () => {
        setError(null);
        try {
          const registered = await registerUpload.mutateAsync({
            originalFileUrl: file.url,
            uploadThingKey: file.key,
            fileName: file.name,
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

  const handleResetTailor = useCallback(() => {
    setStep("configure");
    setDownloadUrl(null);
    setAiScore(null);
    setMatchNotes(null);
    setManualTailorJson("");
    setError(null);
    setShowTailorForm(true);
  }, []);

  const showExistingBanner =
    Boolean(existingCvFile) && !showTailorForm && step === "configure";

  const renderExistingBanner = () =>
    existingCvFile ? (
      <div className="border-primary/30 bg-primary/5 flex gap-2.5 rounded-lg border p-4">
        <CheckCircle2
          className="text-primary mt-0.5 size-[18px] shrink-0"
          aria-hidden
        />
        <div className="min-w-0 flex-1 text-[13px]">
          <p className="text-primary font-medium">{t("tailorAlreadyDone")}</p>
          <p className="text-muted-foreground mt-1">
            {t("tailorGeneratedOn", {
              date: new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(existingCvFile.uploadedAt)),
            })}
          </p>
          <div className="mt-2.5">
            <OfficeDocumentPreview
              fileUrl={existingCvFile.url}
              title={t("tailorPreviewTitle")}
              openLabel={t("tailorPreviewOpen")}
              closeLabel={t("tailorPreviewClose")}
              defaultOpen={previewDefaultOpen}
              leadingActions={
                <a
                  href={existingCvFile.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Download className="mr-1.5 size-3.5" aria-hidden />
                  {t("tailorDownload")}
                </a>
              }
              trailingActions={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetTailor}
                >
                  {t("tailorRegenerate")}
                </Button>
              }
            />
          </div>
        </div>
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
            resetKey={uploadId ?? "new"}
            onUploaded={(file) => {
              void handleUploadComplete([
                {
                  url: file.url,
                  key: file.key,
                  name: file.name,
                },
              ]);
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
      <div className="border-primary/30 bg-primary/5 mt-4 rounded-lg border p-3.5">
        <div className="flex gap-2">
          <CheckCircle2
            className="text-primary mt-0.5 size-[18px] shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-primary text-[13px] font-medium">
              {t("tailorSuccessTitle")}
            </p>
            {aiScore !== null ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {t("tailorScore", { score: Math.round(aiScore) })}
              </p>
            ) : null}
            {matchNoteItems.length > 0 ? (
              <ul className="text-muted-foreground mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
                {matchNoteItems.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : matchNotes ? (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {matchNotes}
              </p>
            ) : null}
            <div className="mt-2.5">
              <OfficeDocumentPreview
                fileUrl={downloadUrl}
                title={t("tailorPreviewTitle")}
                openLabel={t("tailorPreviewOpen")}
                closeLabel={t("tailorPreviewClose")}
                defaultOpen={previewDefaultOpen}
                leadingActions={
                  <a
                    href={downloadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Download className="mr-1.5 size-3.5" aria-hidden />
                    {t("tailorDownload")}
                  </a>
                }
                trailingActions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTailor}
                  >
                    {t("tailorRegenerate")}
                  </Button>
                }
              />
            </div>
          </div>
        </div>
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
            {aiScore !== null && (
              <p className="text-sm">
                {t("tailorScore", { score: Math.round(aiScore) })}
              </p>
            )}
            {matchNotes && (
              <p className="text-muted-foreground text-sm">{matchNotes}</p>
            )}
            <OfficeDocumentPreview
              fileUrl={downloadUrl}
              title={t("tailorPreviewTitle")}
              openLabel={t("tailorPreviewOpen")}
              closeLabel={t("tailorPreviewClose")}
              defaultOpen={previewDefaultOpen}
              leadingActions={
                <a
                  href={downloadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("tailorDownload")}
                </a>
              }
              trailingActions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetTailor}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("tailorAgain")}
                  </Button>
                  {applicationId && !embedded ? (
                    <Link
                      href={{
                        pathname: "/admin/job-tracker/applications/[id]",
                        params: { id: applicationId },
                      }}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      {t("tailorBackToApplication")}
                    </Link>
                  ) : null}
                </>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
