"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, Sparkles, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [mode, setMode] = useState<AiProcessingMode>("auto");
  const [provider, setProvider] = useState<AiProviderName | null>(null);
  const [manualJson, setManualJson] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [replaceOnBuild, setReplaceOnBuild] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolInput, setCustomToolInput] = useState("");
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
      focusTools: selectedTools.length > 0 ? selectedTools : undefined,
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
  const suggestedTools = pageData.data?.suggestedTools ?? [];

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

  const handleToggleTool = useCallback((tool: string) => {
    setSelectedTools((previous) =>
      previous.includes(tool)
        ? previous.filter((item) => item !== tool)
        : [...previous, tool],
    );
  }, []);

  const handleAddCustomTool = useCallback(() => {
    const trimmed = customToolInput.trim();
    if (!trimmed) return;
    setSelectedTools((previous) =>
      previous.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? previous
        : [...previous, trimmed],
    );
    setCustomToolInput("");
  }, [customToolInput]);

  const handleClearSelectedTools = useCallback(() => {
    setSelectedTools([]);
  }, []);

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
    (replace: boolean, overrideTools?: string[]) => {
      if (!eventId) return;
      const toolsToUse =
        overrideTools ?? (selectedTools.length > 0 ? selectedTools : undefined);
      startTransition(async () => {
        try {
          await generateAuto.mutateAsync({
            applicationId,
            eventId,
            provider: effectiveProvider ?? undefined,
            replace,
            focusTools: toolsToUse,
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
    [
      applicationId,
      effectiveProvider,
      eventId,
      generateAuto,
      invalidate,
      selectedTools,
      t,
    ],
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

  const handleGenerateForTool = useCallback(
    (tool: string) => {
      runAuto(false, [tool]);
    },
    [runAuto],
  );

  if (pageData.isLoading || aiSettings.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t("aiSettingsLoading")}
      </div>
    );
  }

  const generatorOpen = !hasQuestions || showGenerator;

  return (
    <div className="flex flex-col gap-5">
      {selectedEvent ? (
        <p className="text-muted-foreground text-xs">
          {t("eventHint", {
            type: t(`eventType.${selectedEvent.type}`),
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

          <div className="border-border bg-card text-card-foreground rounded-lg border p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="custom-tool-input"
                className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <Wrench className="text-primary size-3.5" aria-hidden />
                {t("focusToolsLabel")}
              </label>
              {selectedTools.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {t("selectedToolsCount", { count: selectedTools.length })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={handleClearSelectedTools}
                  >
                    {t("clearSelectedTools")}
                  </Button>
                </div>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {t("focusToolsHint")}
            </p>

            {suggestedTools.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggestedTools.map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => handleToggleTool(tool)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? (
                        <Check className="size-3" aria-hidden />
                      ) : null}
                      {tool}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedTools.some((tool) => !suggestedTools.includes(tool)) ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTools
                  .filter((tool) => !suggestedTools.includes(tool))
                  .map((customTool) => (
                    <span
                      key={customTool}
                      className="border-primary bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium"
                    >
                      {customTool}
                      <button
                        type="button"
                        onClick={() => handleToggleTool(customTool)}
                        className="hover:opacity-80"
                        aria-label={`Remove ${customTool}`}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  ))}
              </div>
            ) : null}

            <div className="mt-3 flex max-w-sm items-center gap-2">
              <Input
                id="custom-tool-input"
                value={customToolInput}
                onChange={(event) => setCustomToolInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddCustomTool();
                  }
                }}
                placeholder={t("customToolPlaceholder")}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={handleAddCustomTool}
                disabled={!customToolInput.trim()}
              >
                <Plus className="mr-1 size-3.5" aria-hidden />
                {t("addCustomTool")}
              </Button>
            </div>
          </div>

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
          suggestedTools={suggestedTools}
          onRegenerate={
            generatorOpen
              ? undefined
              : () => {
                  setReplaceOnBuild(true);
                  setShowGenerator(true);
                }
          }
          onGenerateMore={generatorOpen ? undefined : handleGenerateMore}
          onGenerateForTool={
            generatorOpen || !hasAutoProviders
              ? undefined
              : handleGenerateForTool
          }
          isGeneratingMore={isPending && !showGenerator}
        />
      ) : null}
    </div>
  );
};
