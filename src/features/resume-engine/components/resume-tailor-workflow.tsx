"use client";

import type { FC } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";
import {
  parseMatchAnalysis,
  type CvMatchAnalysis,
} from "@/features/resume-engine/lib/cv-match-analysis";
import {
  ResumeTailorSourceSelector,
  type ResumeTailorSourceType,
} from "@/features/resume-engine/components/resume-tailor-source-selector";
import { ResumeTailorErrorAlert } from "@/features/resume-engine/components/resume-tailor-error-alert";
import { ResumeTailorProgress } from "@/features/resume-engine/components/resume-tailor-progress";
import {
  ResumeTailorExistingBanner,
  type ExistingCvFile,
} from "@/features/resume-engine/components/resume-tailor-existing-banner";
import { ResumeTailorResultView } from "@/features/resume-engine/components/resume-tailor-result-view";

type Step = "configure" | "tailoring" | "done";

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
  const [sourceType, setSourceType] =
    useState<ResumeTailorSourceType>("studio");
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

  const handleSwitchToManual = useCallback(() => {
    setMode("manual");
    setError(null);
  }, []);

  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  const previewFileUrl = downloadUrl ?? existingCvFile?.url ?? "";
  const showExistingBanner =
    Boolean(existingCvFile) && !showTailorForm && step === "configure";

  if (pageData.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t("tailorLoading")}
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="w-full">
        {step === "tailoring" ? (
          <ResumeTailorProgress embedded />
        ) : step === "done" && downloadUrl ? (
          <div className="mt-4">
            <ResumeTailorResultView
              previewFileUrl={previewFileUrl}
              fileName={latestExport?.fileName ?? existingCvFile?.name}
              mimeType={latestExport?.mimeType}
              structuredSnapshot={structuredSnapshot}
              downloadUrl={downloadUrl}
              pdfDownloadUrl={pdfDownloadUrl}
              aiScore={aiScore}
              matchNotes={matchNotes}
              matchAnalysis={matchAnalysis}
              exportId={exportId}
              applicationId={applicationId}
              embedded
              onResetTailor={handleResetTailor}
              onPolishedUpload={handlePolishedUpload}
            />
          </div>
        ) : showExistingBanner && existingCvFile ? (
          <ResumeTailorExistingBanner existingCvFile={existingCvFile}>
            <ResumeTailorResultView
              previewFileUrl={previewFileUrl}
              fileName={latestExport?.fileName ?? existingCvFile.name}
              mimeType={latestExport?.mimeType}
              structuredSnapshot={structuredSnapshot}
              downloadUrl={downloadUrl}
              pdfDownloadUrl={pdfDownloadUrl}
              aiScore={aiScore}
              matchNotes={matchNotes}
              matchAnalysis={matchAnalysis}
              exportId={exportId}
              applicationId={applicationId}
              embedded
              onResetTailor={handleResetTailor}
              onPolishedUpload={handlePolishedUpload}
            />
          </ResumeTailorExistingBanner>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {t("tailorPageDescription")}
            </p>

            <ResumeTailorSourceSelector
              sourceType={sourceType}
              onSourceTypeChange={setSourceType}
              hasStudioData={hasStudioData}
              studioPreview={pageData.data?.studioPreview}
              uploads={uploads}
              uploadId={uploadId}
              onUploadIdChange={setUploadId}
              onUploadComplete={handleUploadComplete}
              onError={setError}
              compact
            />

            <div>
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
                  layout="compact"
                />
              )}
            </div>

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
                  (sourceType === "studio" ? hasStudioData : Boolean(uploadId))
                }
                variant="compact"
                hideSubmit
              />
            ) : null}

            <Button
              type="button"
              className="mt-1 w-full sm:w-auto sm:min-w-50"
              disabled={isPending || step !== "configure"}
              onClick={
                effectiveMode === "manual"
                  ? handleTailorManual
                  : handleTailorAuto
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" aria-hidden />
              )}
              {t("tailorCta")}
            </Button>

            <ResumeTailorErrorAlert
              error={error}
              isPending={isPending}
              effectiveMode={effectiveMode}
              hasAutoProviders={hasAutoProviders}
              onRetry={
                effectiveMode === "manual"
                  ? handleTailorManual
                  : handleTailorAuto
              }
              onClearError={handleClearError}
              onSwitchToManual={handleSwitchToManual}
            />
          </div>
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
                <FileText className="size-5" />
                {t("tailorSourceTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeTailorSourceSelector
                sourceType={sourceType}
                onSourceTypeChange={setSourceType}
                hasStudioData={hasStudioData}
                studioPreview={pageData.data?.studioPreview}
                uploads={uploads}
                uploadId={uploadId}
                onUploadIdChange={setUploadId}
                onUploadComplete={handleUploadComplete}
                onError={setError}
              />
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5" />
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
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 size-4" />
                  )}
                  {t("tailorCta")}
                </Button>
              )}

              <ResumeTailorErrorAlert
                error={error}
                isPending={isPending}
                effectiveMode={effectiveMode}
                hasAutoProviders={hasAutoProviders}
                onRetry={
                  effectiveMode === "manual"
                    ? handleTailorManual
                    : handleTailorAuto
                }
                onClearError={handleClearError}
                onSwitchToManual={handleSwitchToManual}
              />
            </CardContent>
          </Card>
        </>
      )}

      {step === "tailoring" && <ResumeTailorProgress />}

      {step === "done" && downloadUrl && (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="text-primary size-5" />
              {t("tailorDoneTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ResumeTailorResultView
              previewFileUrl={previewFileUrl}
              fileName={latestExport?.fileName ?? existingCvFile?.name}
              mimeType={latestExport?.mimeType}
              structuredSnapshot={structuredSnapshot}
              downloadUrl={downloadUrl}
              pdfDownloadUrl={pdfDownloadUrl}
              aiScore={aiScore}
              matchNotes={matchNotes}
              matchAnalysis={matchAnalysis}
              exportId={exportId}
              applicationId={applicationId}
              onResetTailor={handleResetTailor}
              onPolishedUpload={handlePolishedUpload}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
