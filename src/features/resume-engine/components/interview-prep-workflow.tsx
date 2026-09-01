"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import { InterviewPrepPractice } from "@/features/resume-engine/components/interview-prep-practice";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

interface InterviewPrepWorkflowProps {
  applicationId: string;
  eventId: string;
}

export const InterviewPrepWorkflow: FC<InterviewPrepWorkflowProps> = ({
  applicationId,
  eventId,
}) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const tTracker = useTranslations("admin.jobTracker");
  const tStudio = useTranslations("admin.resumeStudio");
  const [mode, setMode] = useState<AiProcessingMode>("auto");
  const [provider, setProvider] = useState<AiProviderName | null>(null);
  const [manualJson, setManualJson] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [replaceOnBuild, setReplaceOnBuild] = useState(true);
  const [isPending, startTransition] = useTransition();

  const aiSettings = api.interviewPrepAdmin.getAiSettings.useQuery();
  const pageData = api.interviewPrepAdmin.getInterviewPrepPageData.useQuery({
    applicationId,
    eventId,
  });
  const promptQuery = api.interviewPrepAdmin.getInterviewPrepPrompt.useQuery(
    {
      applicationId,
      eventId,
      append: !replaceOnBuild,
    },
    { enabled: false },
  );
  const generateAuto =
    api.interviewPrepAdmin.generateInterviewPrep.useMutation();
  const generateManual =
    api.interviewPrepAdmin.generateInterviewPrepManual.useMutation();
  const utils = api.useUtils();

  const hasAutoProviders = aiSettings.data?.hasAutoProviders ?? false;
  const providers = aiSettings.data?.providers ?? [];
  const defaultProvider = aiSettings.data?.defaultProvider ?? null;
  const effectiveMode: AiProcessingMode =
    aiSettings.data && !hasAutoProviders ? "manual" : mode;
  const effectiveProvider = provider ?? defaultProvider;
  const selectedEvent = pageData.data?.event ?? null;
  const canBuild = pageData.data?.hasJobDescription ?? false;
  const questions = pageData.data?.questions ?? [];
  const hasQuestions = questions.length > 0;

  const invalidate = useCallback(async () => {
    await utils.interviewPrepAdmin.getInterviewPrepPageData.invalidate({
      applicationId,
      eventId,
    });
  }, [
    applicationId,
    eventId,
    utils.interviewPrepAdmin.getInterviewPrepPageData,
  ]);

  const handleLoadPrompt = useCallback(async () => {
    if (!eventId) return null;
    try {
      const result = await promptQuery.refetch();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("failed");
      toast.error(t("failed"), { description: message });
      return null;
    }
  }, [eventId, promptQuery, t]);

  const runAuto = useCallback(
    (replace: boolean) => {
      if (!eventId) return;
      startTransition(async () => {
        try {
          await generateAuto.mutateAsync({
            applicationId,
            eventId,
            provider: effectiveProvider ?? undefined,
            replace,
          });
          toast.success(replace ? t("success") : t("moreSuccess"));
          setShowGenerator(false);
          await invalidate();
        } catch (err) {
          const message = err instanceof Error ? err.message : t("failed");
          toast.error(t("failed"), { description: message });
        }
      });
    },
    [applicationId, effectiveProvider, eventId, generateAuto, invalidate, t],
  );

  const handleBuildManual = useCallback(() => {
    if (!eventId) return;
    startTransition(async () => {
      try {
        await generateManual.mutateAsync({
          applicationId,
          eventId,
          rawJson: manualJson,
          replace: replaceOnBuild,
        });
        toast.success(replaceOnBuild ? t("success") : t("moreSuccess"));
        setManualJson("");
        setShowGenerator(false);
        await invalidate();
      } catch (err) {
        const message = err instanceof Error ? err.message : t("failed");
        toast.error(t("failed"), { description: message });
      }
    });
  }, [
    applicationId,
    eventId,
    generateManual,
    invalidate,
    manualJson,
    replaceOnBuild,
    t,
  ]);

  const handleBuild = useCallback(() => {
    if (effectiveMode === "manual") {
      handleBuildManual();
    } else {
      runAuto(replaceOnBuild);
    }
  }, [effectiveMode, handleBuildManual, replaceOnBuild, runAuto]);

  const handleGenerateMore = useCallback(() => {
    if (!hasAutoProviders) {
      setReplaceOnBuild(false);
      setShowGenerator(true);
      return;
    }
    runAuto(false);
  }, [hasAutoProviders, runAuto]);

  if (pageData.isLoading || aiSettings.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {tStudio("aiSettingsLoading")}
      </div>
    );
  }

  const generatorOpen = !hasQuestions || showGenerator;

  return (
    <div className="flex flex-col gap-5">
      {selectedEvent ? (
        <p className="text-muted-foreground text-xs">
          {t("eventHint", {
            type: tTracker(`eventType.${selectedEvent.type}`),
          })}
        </p>
      ) : null}

      {generatorOpen ? (
        <>
          <div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("hint")}
            </p>
            {pageData.data?.hasTailoredSnapshot ? (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t("usingTailored")}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t("usingStudio")}
              </p>
            )}
          </div>

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

          {effectiveMode === "manual" ? (
            <ManualAiPanel
              promptPackage={promptQuery.data}
              isLoadingPrompt={promptQuery.isFetching}
              onLoadPrompt={handleLoadPrompt}
              rawJson={manualJson}
              onRawJsonChange={setManualJson}
              onSubmit={handleBuildManual}
              isPending={isPending}
              submitLabel={
                replaceOnBuild && hasQuestions ? t("regenerate") : t("cta")
              }
              canLoadPrompt={canBuild}
              variant="compact"
              hideSubmit
            />
          ) : null}

          {!canBuild ? (
            <p className="text-muted-foreground text-xs" role="status">
              {t("needJd")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="w-full sm:w-auto sm:min-w-50"
              disabled={
                isPending ||
                !canBuild ||
                (effectiveMode === "manual" && manualJson.trim().length < 2)
              }
              onClick={handleBuild}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" aria-hidden />
              )}
              {replaceOnBuild && hasQuestions ? t("regenerate") : t("cta")}
            </Button>
            {hasQuestions ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setShowGenerator(false)}
              >
                {t("cancelRegenerate")}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {hasQuestions ? (
        <InterviewPrepPractice
          eventId={eventId}
          questions={questions}
          eventType={selectedEvent?.type ?? "INTERVIEW"}
          onRegenerate={
            generatorOpen
              ? undefined
              : () => {
                  setReplaceOnBuild(true);
                  setShowGenerator(true);
                }
          }
          onGenerateMore={generatorOpen ? undefined : handleGenerateMore}
          isGeneratingMore={isPending && !showGenerator}
        />
      ) : null}
    </div>
  );
};
