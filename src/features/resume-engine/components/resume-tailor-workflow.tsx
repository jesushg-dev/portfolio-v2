"use client";
import type { Locale } from "@/i18n/config";

import type { FC } from "react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isTRPCClientError } from "@trpc/client";

import { api } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
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
import { ResumeTemplateSelector } from "./resume-template-selector";
import { VacancySkillConfirmation } from "./vacancy-skill-confirmation";
import {
  technologyNameKey,
  vacancySkillSuggestions,
  type TechnologyEquivalence,
} from "../lib/extract-job-tools";
import type { AiPromptPackage } from "../lib/ai/prompt-package";
import { parseAiJsonResponse } from "../lib/ai/parse-json-response";
import { CvMatchAnalysisSchema } from "../lib/cv-match-analysis";
import {
  DEFAULT_CV_TEMPLATE_VERSION,
  type CvTemplateVersion,
} from "@/features/resume-engine/lib/template-registry";
import {
  ResumeTailorErrorAlert,
  type EquivalenceResolutionBatch,
  type ResumeTailorErrorAlertProps,
  type ResumeTailorFailure,
} from "@/features/resume-engine/components/resume-tailor-error-alert";
import { ResumeTailorProgress } from "@/features/resume-engine/components/resume-tailor-progress";
import { type ExistingCvFile } from "@/features/resume-engine/components/resume-tailor-existing-banner";
import { ResumeTailorResultView } from "@/features/resume-engine/components/resume-tailor-result-view";

type Step = "configure" | "tailoring" | "done";

function mergeEquivalencePair(
  list: TechnologyEquivalence[],
  pair: TechnologyEquivalence,
): TechnologyEquivalence[] {
  const key = `${technologyNameKey(pair.original)}->${technologyNameKey(pair.proposed)}`;
  if (
    list.some(
      (entry) =>
        `${technologyNameKey(entry.original)}->${technologyNameKey(entry.proposed)}` ===
        key,
    )
  ) {
    return list;
  }
  return [...list, pair];
}

interface ResumeTailorWorkflowProps {
  applicationId?: string;
  embedded?: boolean;
  existingCvFile?: ExistingCvFile;
  onSendCv?: () => void;
}

export const ResumeTailorWorkflow: FC<ResumeTailorWorkflowProps> = ({
  applicationId,
  embedded = false,
  existingCvFile,
  onSendCv,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [step, setStep] = useState<Step>("configure");
  const uiLocale = useLocale();
  const [targetLocale, setTargetLocale] = useState<Locale | "auto">("auto");
  const [templateVersion, setTemplateVersion] = useState<CvTemplateVersion>(
    DEFAULT_CV_TEMPLATE_VERSION,
  );
  const [jobDescription, setJobDescription] = useState("");
  const [confirmedTechnologies, setConfirmedTechnologies] = useState<string[]>(
    [],
  );
  const [technologyEquivalences, setTechnologyEquivalences] = useState<
    TechnologyEquivalence[]
  >([]);
  const [rejectedTechnologyEquivalences, setRejectedTechnologyEquivalences] =
    useState<TechnologyEquivalence[]>([]);
  const [correctionPrompt, setCorrectionPrompt] =
    useState<AiPromptPackage | null>(null);
  const [discovery, setDiscovery] = useState<{
    vacancy: string;
    names: string[];
  } | null>(null);
  const [tailoredFileName, setTailoredFileName] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [matchNotes, setMatchNotes] = useState<string | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<CvMatchAnalysis | null>(
    null,
  );
  const [structuredSnapshot, setStructuredSnapshot] = useState<unknown>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<ResumeTailorFailure | null>(null);
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
      confirmedTechnologies,
      technologyEquivalences,
      rejectedTechnologyEquivalences,
      applicationId,
      templateVersion,
      targetLocale: targetLocale === "auto" ? undefined : targetLocale,
      uiLocale,
      jobDescription:
        jobDescription.trim().length > 0
          ? jobDescription.trim()
          : (pageData.data?.application?.description?.trim() ?? "placeholder"),
    },
    { enabled: false },
  );

  const tailorResume = api.resumeEngineAdmin.tailorResume.useMutation();
  const discoverTechnologies =
    api.resumeEngineAdmin.discoverVacancyTechnologies.useMutation();
  const tailorResumeManual =
    api.resumeEngineAdmin.tailorResumeManual.useMutation();
  const getCorrectionPrompt =
    api.resumeEngineAdmin.getTailorCorrectionPrompt.useMutation();
  const deleteEquivalence =
    api.resumeEngineAdmin.deleteTechnologyEquivalence.useMutation();

  const savedEquivalences = useMemo(
    () => pageData.data?.savedTechnologyEquivalences ?? [],
    [pageData.data?.savedTechnologyEquivalences],
  );
  const application = pageData.data?.application;
  const latestExport = pageData.data?.latestExport;
  const hasStudioData = pageData.data?.hasStudioData ?? false;
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
  const analysisTerms = useMemo(() => {
    if (!manualTailorJson.trim()) return [];
    try {
      const raw = parseAiJsonResponse(manualTailorJson);
      if (!raw || typeof raw !== "object" || !("matchAnalysis" in raw))
        return [];
      return (
        CvMatchAnalysisSchema.pick({ vacancyTechnologies: true }).safeParse(
          raw.matchAnalysis,
        ).data?.vacancyTechnologies ?? []
      );
    } catch {
      return [];
    }
  }, [manualTailorJson]);

  const isManualReplacement = Boolean(
    existingCvFile &&
    latestExport &&
    existingCvFile.url !== latestExport.fileUrl &&
    existingCvFile.url !== latestExport.pdfFileUrl,
  );
  if (
    !showTailorForm &&
    !isManualReplacement &&
    latestExport &&
    appliedExportId !== latestExport.id
  ) {
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
      fileName?: string | null;
      aiScore: number | null;
      matchNotes?: string | null;
      matchAnalysis?: unknown;
      structuredSnapshot?: unknown;
      pdfDownloadUrl?: string | null;
    }) => {
      setDownloadUrl(result.downloadUrl);
      if (result.fileName) setTailoredFileName(result.fileName);
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

  const handleTailorFailure = useCallback(
    (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("tailorFailed");
      const validation = isTRPCClientError<AppRouter>(error)
        ? error.data?.resumeTailorIssues
        : undefined;
      const [issue] = validation ?? [];
      let description = validation?.length
        ? t("tailorValidation.intro")
        : message;
      if (issue?.field === "technologyName") {
        description = issue.original
          ? t("tailorValidation.technologyRename", {
              original: issue.original,
              proposed: issue.proposed,
            })
          : t("tailorValidation.unknownTechnologyProposal", {
              proposed: issue.proposed,
            });
      }
      setError({ message, validation });
      setStep("configure");
      toast.error(t("tailorFailed"), { description });
    },
    [t],
  );

  const runTailorAuto = useCallback(
    (overrides?: {
      confirmed?: string[];
      equivalences?: TechnologyEquivalence[];
      rejected?: TechnologyEquivalence[];
    }) => {
      if (effectiveJobDescription.length < 20) {
        setError({ message: t("tailorJdTooShort") });
        return;
      }
      if (!hasStudioData) {
        setError({ message: t("tailorNoStudioData") });
        return;
      }

      const nextConfirmed = overrides?.confirmed ?? confirmedTechnologies;
      const nextEquivalences =
        overrides?.equivalences ?? technologyEquivalences;
      const nextRejected =
        overrides?.rejected ?? rejectedTechnologyEquivalences;

      startTransition(async () => {
        setError(null);
        setCorrectionPrompt(null);
        setStep("tailoring");
        try {
          let vacancyTechnologies = discovery?.names ?? [];
          if (discovery?.vacancy !== effectiveJobDescription) {
            const names = await discoverTechnologies
              .mutateAsync({
                jobDescription: effectiveJobDescription,
                provider: effectiveProvider ?? undefined,
              })
              .catch(() => []);
            setDiscovery({ vacancy: effectiveJobDescription, names });
            vacancyTechnologies = names;
            const declared = pageData.data?.declaredTechnologies ?? [];
            const knownEquivalences = [
              ...savedEquivalences,
              ...nextEquivalences,
            ];
            const offered = vacancySkillSuggestions(
              effectiveJobDescription,
              declared,
              nextConfirmed,
              knownEquivalences,
            );
            const discovered = vacancySkillSuggestions(
              effectiveJobDescription,
              declared,
              names,
              knownEquivalences,
            );
            if (discovered.some((name) => !offered.includes(name))) {
              setStep("configure");
              toast.info(t("vacancySkillsReview"));
              return;
            }
          }
          const result = await tailorResume.mutateAsync({
            confirmedTechnologies: nextConfirmed,
            technologyEquivalences: nextEquivalences,
            rejectedTechnologyEquivalences: nextRejected,
            vacancyTechnologies,
            jobDescription: effectiveJobDescription,
            applicationId,
            provider: effectiveProvider ?? undefined,
            templateVersion,
            targetLocale: targetLocale === "auto" ? undefined : targetLocale,
            uiLocale,
          });
          applyTailorResult(result);
          setStep("done");
          toast.success(t("tailorSuccess"));
        } catch (err) {
          handleTailorFailure(err);
        } finally {
          if (nextEquivalences.length > 0) void pageData.refetch?.();
        }
      });
    },
    [
      applicationId,
      effectiveJobDescription,
      effectiveProvider,
      confirmedTechnologies,
      technologyEquivalences,
      savedEquivalences,
      rejectedTechnologyEquivalences,
      discovery,
      discoverTechnologies,
      pageData,
      hasStudioData,
      handleTailorFailure,
      tailorResume,
      applyTailorResult,
      t,
      templateVersion,
      targetLocale,
      uiLocale,
    ],
  );

  const handleTailorAuto = useCallback(() => {
    runTailorAuto();
  }, [runTailorAuto]);

  const runTailorManual = useCallback(
    (overrides?: {
      confirmed?: string[];
      equivalences?: TechnologyEquivalence[];
    }) => {
      if (effectiveJobDescription.length < 20) {
        setError({ message: t("tailorJdTooShort") });
        return;
      }
      if (!hasStudioData) {
        setError({ message: t("tailorNoStudioData") });
        return;
      }

      const nextConfirmed = overrides?.confirmed ?? confirmedTechnologies;
      const nextEquivalences =
        overrides?.equivalences ?? technologyEquivalences;

      startTransition(async () => {
        setError(null);
        setCorrectionPrompt(null);
        setStep("tailoring");
        try {
          const result = await tailorResumeManual.mutateAsync({
            confirmedTechnologies: nextConfirmed,
            technologyEquivalences: nextEquivalences,
            rejectedTechnologyEquivalences,
            jobDescription: effectiveJobDescription,
            applicationId,
            rawJson: manualTailorJson,
            templateVersion,
            targetLocale: targetLocale === "auto" ? undefined : targetLocale,
            uiLocale,
          });
          applyTailorResult(result);
          setStep("done");
          toast.success(t("tailorSuccess"));
        } catch (err) {
          handleTailorFailure(err);
        } finally {
          if (nextEquivalences.length > 0) void pageData.refetch?.();
        }
      });
    },
    [
      applicationId,
      effectiveJobDescription,
      hasStudioData,
      handleTailorFailure,
      manualTailorJson,
      confirmedTechnologies,
      technologyEquivalences,
      rejectedTechnologyEquivalences,
      tailorResumeManual,
      applyTailorResult,
      pageData,
      t,
      templateVersion,
      targetLocale,
      uiLocale,
    ],
  );

  const handleTailorManual = useCallback(() => {
    runTailorManual();
  }, [runTailorManual]);

  const requestCorrectionPrompt = useCallback(
    async (
      rejected: TechnologyEquivalence[],
      approvedOverride?: TechnologyEquivalence[],
      confirmedOverride?: string[],
    ) => {
      if (!error?.message || manualTailorJson.trim().length < 2) return;
      const nextEquivalences = approvedOverride ?? technologyEquivalences;
      const nextConfirmed = confirmedOverride ?? confirmedTechnologies;
      try {
        const promptPkg = await getCorrectionPrompt.mutateAsync({
          confirmedTechnologies: nextConfirmed,
          technologyEquivalences: nextEquivalences,
          rejectedTechnologyEquivalences: rejected,
          applicationId,
          templateVersion,
          targetLocale: targetLocale === "auto" ? undefined : targetLocale,
          uiLocale,
          jobDescription: effectiveJobDescription,
          previousRawJson: manualTailorJson,
          validationError: error.message,
        });
        setCorrectionPrompt(promptPkg);
        if (approvedOverride?.length) void pageData.refetch?.();
        try {
          await navigator.clipboard.writeText(promptPkg.combinedPrompt);
          toast.success(t("tailorValidation.correctionPromptReady"));
        } catch {
          // Preview panel remains visible with an explicit copy button if clipboard fails.
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : t("tailorValidation.correctionPromptFailed"),
        );
      }
    },
    [
      applicationId,
      confirmedTechnologies,
      effectiveJobDescription,
      error,
      getCorrectionPrompt,
      manualTailorJson,
      pageData,
      t,
      targetLocale,
      templateVersion,
      technologyEquivalences,
      uiLocale,
    ],
  );

  const handleResolveEquivalences = useCallback(
    ({ approved, rejected }: EquivalenceResolutionBatch) => {
      const nextEquivalences = approved.reduce(
        (acc, pair) => mergeEquivalencePair(acc, pair),
        technologyEquivalences,
      );
      const approvedProposedKeys = new Set(
        approved.map((pair) => technologyNameKey(pair.proposed)),
      );
      const nextConfirmed = confirmedTechnologies.filter(
        (name) => !approvedProposedKeys.has(technologyNameKey(name)),
      );
      const nextRejected = rejected.reduce(
        (acc, pair) => mergeEquivalencePair(acc, pair),
        rejectedTechnologyEquivalences,
      );
      setTechnologyEquivalences(nextEquivalences);
      setConfirmedTechnologies(nextConfirmed);
      if (rejected.length === 0) {
        setCorrectionPrompt(null);
        if (effectiveMode === "manual") {
          runTailorManual({
            confirmed: nextConfirmed,
            equivalences: nextEquivalences,
          });
        } else {
          runTailorAuto({
            confirmed: nextConfirmed,
            equivalences: nextEquivalences,
          });
        }
        return;
      }
      setRejectedTechnologyEquivalences(nextRejected);
      if (effectiveMode === "manual") {
        void requestCorrectionPrompt(
          nextRejected,
          nextEquivalences,
          nextConfirmed,
        );
      } else {
        runTailorAuto({
          confirmed: nextConfirmed,
          equivalences: nextEquivalences,
          rejected: nextRejected,
        });
      }
    },
    [
      confirmedTechnologies,
      effectiveMode,
      rejectedTechnologyEquivalences,
      requestCorrectionPrompt,
      runTailorAuto,
      runTailorManual,
      technologyEquivalences,
    ],
  );

  const handleCreateCorrectionPrompt = useCallback(() => {
    void requestCorrectionPrompt(rejectedTechnologyEquivalences);
  }, [rejectedTechnologyEquivalences, requestCorrectionPrompt]);

  const handleRemoveSavedEquivalence = useCallback(
    (id: string) => {
      const removed = savedEquivalences.find((entry) => entry.id === id);
      startTransition(async () => {
        try {
          await deleteEquivalence.mutateAsync({ id });
          if (removed) {
            const removedKey = `${technologyNameKey(removed.original)}->${technologyNameKey(removed.proposed)}`;
            setTechnologyEquivalences((prev) =>
              prev.filter(
                (entry) =>
                  `${technologyNameKey(entry.original)}->${technologyNameKey(entry.proposed)}` !==
                  removedKey,
              ),
            );
          }
          await pageData.refetch?.();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("tailorFailed"));
        }
      });
    },
    [deleteEquivalence, pageData, savedEquivalences, t],
  );

  const handleLoadTailorPrompt = useCallback(async () => {
    if (effectiveJobDescription.length < 20) {
      setError({ message: t("tailorJdTooShort") });
      return null;
    }
    const result = await tailorPrompt.refetch();
    if (result.error) setError({ message: result.error.message });
    return result.data ?? null;
  }, [effectiveJobDescription.length, t, tailorPrompt]);

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
    setConfirmedTechnologies([]);
    setTechnologyEquivalences([]);
    setRejectedTechnologyEquivalences([]);
    setCorrectionPrompt(null);
  }, []);

  const handleSwitchToManual = useCallback(() => {
    setMode("manual");
    setError(null);
    setCorrectionPrompt(null);
  }, []);

  const handleClearError = useCallback(() => {
    setError(null);
    setCorrectionPrompt(null);
  }, []);

  const previewFileUrl = downloadUrl ?? existingCvFile?.url ?? "";
  const skillConfirmation = hasStudioData && (
    <VacancySkillConfirmation
      key={effectiveJobDescription}
      vacancy={effectiveJobDescription}
      declared={pageData.data?.declaredTechnologies ?? []}
      confirmed={confirmedTechnologies}
      equivalences={technologyEquivalences}
      savedEquivalences={savedEquivalences}
      isRemovingEquivalence={deleteEquivalence.isPending}
      suggestions={[
        ...analysisTerms,
        ...(discovery?.vacancy === effectiveJobDescription
          ? discovery.names
          : []),
      ]}
      onChange={(names) => {
        setConfirmedTechnologies(names);
        setError(null);
      }}
      onRemoveSavedEquivalence={handleRemoveSavedEquivalence}
    />
  );
  const errorAlertProps: ResumeTailorErrorAlertProps = {
    error,
    isPending,
    isGeneratingCorrection: getCorrectionPrompt.isPending,
    effectiveMode,
    hasAutoProviders,
    correctionPrompt,
    onRetry: effectiveMode === "manual" ? handleTailorManual : handleTailorAuto,
    onClearError: handleClearError,
    onSwitchToManual: handleSwitchToManual,
    onResolveEquivalences: handleResolveEquivalences,
    onCreateCorrectionPrompt:
      manualTailorJson.trim().length >= 2
        ? handleCreateCorrectionPrompt
        : undefined,
  };
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
              fileName={
                tailoredFileName ??
                latestExport?.fileName ??
                existingCvFile?.name
              }
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
              onSendCv={onSendCv}

              onPdfGenerated={(url) => setPdfDownloadUrl(url)}
            />
          </div>
        ) : showExistingBanner && existingCvFile ? (
          <div>
            <ResumeTailorResultView
              previewFileUrl={previewFileUrl}
              fileName={existingCvFile.name}
              manuallyCorrected={isManualReplacement || !latestExport}
              mimeType={
                isManualReplacement ? undefined : latestExport?.mimeType
              }
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
              onSendCv={onSendCv}

              onPdfGenerated={(url) => setPdfDownloadUrl(url)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {t("tailorPageDescription")}
            </p>

            <ResumeTemplateSelector
              templateVersion={templateVersion}
              onTemplateVersionChange={(value) => {
                setTemplateVersion(value);
                setManualTailorJson("");
              }}
              targetLocale={targetLocale}
              onTargetLocaleChange={(value) => {
                setTargetLocale(value);
                setManualTailorJson("");
              }}
              hasStudioData={hasStudioData}
              studioPreview={pageData.data?.studioPreview}

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

            {skillConfirmation}
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
                  effectiveJobDescription.length >= 20 && hasStudioData
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

            <ResumeTailorErrorAlert {...errorAlertProps} />
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
              <ResumeTemplateSelector
                templateVersion={templateVersion}
                onTemplateVersionChange={(value) => {
                  setTemplateVersion(value);
                  setManualTailorJson("");
                }}
                targetLocale={targetLocale}
                onTargetLocaleChange={(value) => {
                  setTargetLocale(value);
                  setManualTailorJson("");
                }}
                hasStudioData={hasStudioData}
                studioPreview={pageData.data?.studioPreview}
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
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setConfirmedTechnologies([]);
                  setTechnologyEquivalences([]);
                  setRejectedTechnologyEquivalences([]);
                  setCorrectionPrompt(null);
                  setManualTailorJson("");
                  setError(null);
                }}
                placeholder={t("tailorJdPlaceholder")}
                rows={10}
                className="resize-y"
              />

              {skillConfirmation}
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
                    effectiveJobDescription.length >= 20 && hasStudioData
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

              <ResumeTailorErrorAlert {...errorAlertProps} />
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
              fileName={
                tailoredFileName ??
                latestExport?.fileName ??
                existingCvFile?.name
              }
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
              onSendCv={onSendCv}

              onPdfGenerated={(url) => setPdfDownloadUrl(url)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
