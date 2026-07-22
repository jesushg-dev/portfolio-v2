"use client";

import type { FC } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import {
  ResumeDocxUpload,
  type ResumeDocxUploadResult,
} from "@/features/resume-engine/components/resume-docx-upload";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

type Step = "upload" | "parsing" | "manual" | "preview" | "imported";

export const ResumeImportWorkflow: FC<{
  onImported?: () => void;
}> = ({ onImported }) => {
  const t = useTranslations("admin.resumeStudio");
  const [step, setStep] = useState<Step>("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CvImportDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AiProcessingMode>("auto");
  const [provider, setProvider] = useState<AiProviderName | null>(null);
  const [manualJson, setManualJson] = useState("");
  const [isPending, startTransition] = useTransition();

  const aiSettings = api.resumeEngineAdmin.getAiSettings.useQuery();
  const importPrompt = api.resumeEngineAdmin.getImportPrompt.useQuery(
    { uploadId: uploadId ?? "" },
    { enabled: false },
  );

  const registerUpload = api.resumeEngineAdmin.registerUpload.useMutation();
  const parseUpload = api.resumeEngineAdmin.parseUpload.useMutation();
  const submitManualImport =
    api.resumeEngineAdmin.submitManualImportDraft.useMutation();
  const confirmImport = api.resumeEngineAdmin.confirmImport.useMutation();

  const hasAutoProviders = aiSettings.data?.hasAutoProviders ?? false;
  const providers = aiSettings.data?.providers ?? [];
  const defaultProvider = aiSettings.data?.defaultProvider ?? null;
  const effectiveMode: AiProcessingMode =
    aiSettings.data && !hasAutoProviders ? "manual" : mode;
  const effectiveProvider = provider ?? defaultProvider;

  const handleParse = useCallback(
    (id: string, selectedProvider: AiProviderName | null) => {
      startTransition(async () => {
        setError(null);
        setStep("parsing");
        try {
          const result = await parseUpload.mutateAsync({
            uploadId: id,
            provider: selectedProvider ?? undefined,
          });
          setDraft(result.draft);
          setStep("preview");
          toast.success(t("parseSuccess"));
        } catch (err) {
          const message = err instanceof Error ? err.message : t("parseFailed");
          setError(message);
          setStep("upload");
          toast.error(t("parseFailed"), { description: message });
        }
      });
    },
    [parseUpload, t],
  );

  const handleManualSubmit = useCallback(() => {
    if (!uploadId) return;
    startTransition(async () => {
      setError(null);
      try {
        const result = await submitManualImport.mutateAsync({
          uploadId,
          rawJson: manualJson,
        });
        setDraft(result.draft);
        setStep("preview");
        toast.success(t("aiManualImportSuccess"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("aiManualImportFailed");
        setError(message);
        toast.error(t("aiManualImportFailed"), { description: message });
      }
    });
  }, [manualJson, submitManualImport, t, uploadId]);

  const handleLoadPrompt = useCallback(() => {
    if (!uploadId) return;
    void importPrompt.refetch();
  }, [importPrompt, uploadId]);

  const handleImport = useCallback(() => {
    if (!uploadId) return;
    startTransition(async () => {
      setError(null);
      try {
        await confirmImport.mutateAsync({ uploadId });
        setStep("imported");
        toast.success(t("importSuccess"));
      } catch (err) {
        const message = err instanceof Error ? err.message : t("importFailed");
        setError(message);
        toast.error(t("importFailed"), { description: message });
      }
    });
  }, [confirmImport, t, uploadId]);

  const handleUploadComplete = useCallback(
    (file: ResumeDocxUploadResult) => {
      startTransition(async () => {
        setError(null);
        setManualJson("");
        try {
          const record = await registerUpload.mutateAsync({
            originalFileUrl: file.url,
            uploadThingKey: file.key,
            fileName: file.name,
            mimeType: file.mimeType,
          });
          setUploadId(record.id);

          if (effectiveMode === "auto") {
            handleParse(record.id, effectiveProvider);
          } else {
            setStep("manual");
            toast.success(t("uploadReadyManual"));
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("uploadFailed");
          setError(message);
          toast.error(t("uploadFailed"), { description: message });
        }
      });
    },
    [effectiveMode, effectiveProvider, handleParse, registerUpload, t],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base">{t("aiSettingsTitle")}</CardTitle>
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
            <Upload className="size-5" />
            {t("uploadTitle")}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {t("uploadDescription")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(step === "upload" || step === "manual") && (
            <ResumeDocxUpload
              resetKey={uploadId ?? step}
              onUploaded={handleUploadComplete}
              onError={(message) => {
                setError(message);
                toast.error(t("uploadFailed"), { description: message });
              }}
            />
          )}

          {step === "parsing" && (
            <div className="text-muted-foreground flex items-center gap-3 py-8">
              <Loader2 className="text-primary size-5 animate-spin" />
              <div>
                <p className="text-foreground font-medium">
                  {t("parsingTitle")}
                </p>
                <p className="text-sm">{t("parsingDescription")}</p>
              </div>
            </div>
          )}

          {step === "manual" && uploadId ? (
            <ManualAiPanel
              promptPackage={importPrompt.data}
              isLoadingPrompt={importPrompt.isFetching}
              onLoadPrompt={handleLoadPrompt}
              rawJson={manualJson}
              onRawJsonChange={setManualJson}
              onSubmit={handleManualSubmit}
              isPending={isPending}
              submitLabel={t("aiManualImportCta")}
              canLoadPrompt={Boolean(uploadId)}
            />
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </CardContent>
      </Card>

      {step === "preview" && draft ? (
        <PreviewPanel draft={draft} t={t} />
      ) : null}

      {step === "preview" && draft ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleImport} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {t("importCta")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setStep("upload");
              setDraft(null);
              setUploadId(null);
              setManualJson("");
            }}
          >
            {t("uploadAnother")}
          </Button>
        </div>
      ) : null}

      {step === "imported" ? (
        <Card className="bg-card text-card-foreground border-primary/30">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-5" />
              <p className="font-medium">{t("importedTitle")}</p>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("importedDescription")}
            </p>
            {onImported ? (
              <Button type="button" onClick={onImported}>
                {t("importedContinueEditing")}
              </Button>
            ) : (
              <Link href="/admin/cv" className={buttonVariants()}>
                {t("openCvEditor")}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

function PreviewPanel({
  draft,
  t,
}: {
  draft: CvImportDraft;
  t: ReturnType<typeof useTranslations<"admin.resumeStudio">>;
}) {
  const checks = [
    { label: t("checkParse"), done: true },
    { label: t("checkLanguage", { locale: draft.detectedLocale }), done: true },
    {
      label: t("checkSkills", { count: draft.skills.length }),
      done: draft.skills.length > 0,
    },
    {
      label: t("checkExperience", { count: draft.experiences.length }),
      done: draft.experiences.length > 0,
    },
    {
      label: t("checkEducation", { count: draft.education.length }),
      done: draft.education.length > 0,
    },
    {
      label: t("checkCertifications", { count: draft.certifications.length }),
      done: draft.certifications.length > 0,
    },
  ];

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5" />
          {t("previewTitle")}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {t("previewDescription")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-foreground font-medium">
            {draft.header.fullName}
          </h3>
          {draft.header.degree ? (
            <p className="text-muted-foreground text-sm">
              {draft.header.degree}
            </p>
          ) : null}
        </div>

        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-sm">
              <CheckCircle2
                className={
                  check.done
                    ? "text-primary size-4"
                    : "text-muted-foreground size-4"
                }
              />
              <span className="text-foreground">{check.label}</span>
            </li>
          ))}
        </ul>

        {draft.experiences.length > 0 ? (
          <div className="space-y-2">
            <p className="text-foreground text-sm font-medium">
              {t("previewExperiences")}
            </p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {draft.experiences.slice(0, 3).map((exp) => (
                <li key={exp.id}>
                  {exp.role} — {exp.company}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
