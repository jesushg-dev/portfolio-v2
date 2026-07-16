"use client";

import type { FC } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
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

type SourceType = "studio" | "upload";
type Step = "configure" | "tailoring" | "done";

interface ResumeTailorWorkflowProps {
  applicationId?: string;
  embedded?: boolean;
}

export const ResumeTailorWorkflow: FC<ResumeTailorWorkflowProps> = ({
  applicationId,
  embedded = false,
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
  const [manualImportJson, setManualImportJson] = useState("");
  const [isPending, startTransition] = useTransition();

  const aiSettings = api.resumeEngineAdmin.getAiSettings.useQuery();
  const pageData = api.resumeEngineAdmin.getTailorPageData.useQuery({
    applicationId,
  });
  const uploadPreview = api.resumeEngineAdmin.getUploadPreview.useQuery(
    { uploadId: uploadId ?? "" },
    { enabled: Boolean(uploadId && sourceType === "upload") },
  );
  const importPrompt = api.resumeEngineAdmin.getImportPrompt.useQuery(
    { uploadId: uploadId ?? "" },
    { enabled: false },
  );
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
  const parseUpload = api.resumeEngineAdmin.parseUpload.useMutation();
  const submitManualImport =
    api.resumeEngineAdmin.submitManualImportDraft.useMutation();
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

  const uploadHasDraft = Boolean(uploadPreview.data?.draft);
  const needsUploadImport =
    sourceType === "upload" && Boolean(uploadId) && !uploadHasDraft;
  const effectiveMode: AiProcessingMode =
    aiSettings.data && !hasAutoProviders ? "manual" : mode;
  const effectiveProvider = provider ?? defaultProvider;

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
        setManualImportJson("");
        try {
          const registered = await registerUpload.mutateAsync({
            originalFileUrl: file.url,
            uploadThingKey: file.key,
            fileName: file.name,
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          setUploadId(registered.id);

          if (effectiveMode === "auto") {
            await parseUpload.mutateAsync({
              uploadId: registered.id,
              provider: effectiveProvider ?? undefined,
            });
            await uploadPreview.refetch();
            toast.success(t("parseSuccess"));
          } else {
            toast.success(t("uploadReadyManual"));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : t("parseFailed");
          setError(message);
          toast.error(t("parseFailed"), { description: message });
        }
      });
    },
    [
      effectiveMode,
      effectiveProvider,
      parseUpload,
      registerUpload,
      t,
      uploadPreview,
    ],
  );

  const handleManualImportSubmit = useCallback(() => {
    if (!uploadId) return;
    startTransition(async () => {
      setError(null);
      try {
        await submitManualImport.mutateAsync({
          uploadId,
          rawJson: manualImportJson,
        });
        await uploadPreview.refetch();
        toast.success(t("aiManualImportSuccess"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("aiManualImportFailed");
        setError(message);
        toast.error(t("aiManualImportFailed"), { description: message });
      }
    });
  }, [manualImportJson, submitManualImport, t, uploadId, uploadPreview]);

  const handleLoadTailorPrompt = useCallback(() => {
    if (effectiveJobDescription.length < 20) {
      setError(t("tailorJdTooShort"));
      return;
    }
    void tailorPrompt.refetch();
  }, [effectiveJobDescription.length, t, tailorPrompt]);

  if (pageData.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("tailorLoading")}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {!embedded && application && (
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
      )}

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
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSourceType("studio")}
                  disabled={!hasStudioData}
                  className={cn(
                    "border-input bg-background hover:bg-muted rounded-sm border p-4 text-left transition-colors",
                    sourceType === "studio" &&
                      "border-primary ring-ring ring-2",
                    !hasStudioData && "cursor-not-allowed opacity-50",
                  )}
                >
                  <p className="font-medium">{t("tailorSourceStudio")}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {hasStudioData && pageData.data?.studioPreview
                      ? t("tailorSourceStudioHint", {
                          name: pageData.data.studioPreview.fullName,
                          count: pageData.data.studioPreview.experienceCount,
                        })
                      : t("tailorSourceStudioEmpty")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType("upload")}
                  className={cn(
                    "border-input bg-background hover:bg-muted rounded-sm border p-4 text-left transition-colors",
                    sourceType === "upload" &&
                      "border-primary ring-ring ring-2",
                  )}
                >
                  <p className="font-medium">{t("tailorSourceUpload")}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("tailorSourceUploadHint")}
                  </p>
                </button>
              </div>

              {sourceType === "upload" && (
                <div className="flex flex-col gap-3">
                  {uploads.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <Label>{t("tailorRecentUploads")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {uploads.map((upload) => (
                          <Button
                            key={upload.id}
                            type="button"
                            size="sm"
                            variant={
                              uploadId === upload.id ? "default" : "outline"
                            }
                            onClick={() => setUploadId(upload.id)}
                          >
                            {upload.fileName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {needsUploadImport ? (
                    <Card className="bg-muted/30 border-dashed">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {t("tailorUploadImportStep")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ManualAiPanel
                          promptPackage={importPrompt.data}
                          isLoadingPrompt={importPrompt.isFetching}
                          onLoadPrompt={() => {
                            if (uploadId) void importPrompt.refetch();
                          }}
                          rawJson={manualImportJson}
                          onRawJsonChange={setManualImportJson}
                          onSubmit={handleManualImportSubmit}
                          isPending={isPending}
                          submitLabel={t("aiManualImportCta")}
                          canLoadPrompt={Boolean(uploadId)}
                        />
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </CardContent>
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

              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}
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
            <div className="flex flex-wrap gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("tailorDownload")}
              </a>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("configure");
                  setDownloadUrl(null);
                  setAiScore(null);
                  setMatchNotes(null);
                  setManualTailorJson("");
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("tailorAgain")}
              </Button>
              {applicationId && !embedded && (
                <Link
                  href={{
                    pathname: "/admin/job-tracker/applications/[id]",
                    params: { id: applicationId },
                  }}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("tailorBackToApplication")}
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
