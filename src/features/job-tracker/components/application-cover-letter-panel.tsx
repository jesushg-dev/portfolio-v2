"use client";

import { useCallback, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, PenLine, Save, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/shared/form-dialog-content";
import { useRouter } from "@/i18n/routing";
import {
  ResumeAiControls,
  type AiProcessingMode,
} from "@/features/resume-engine/components/resume-ai-controls";
import { ManualAiPanel } from "@/features/resume-engine/components/manual-ai-panel";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";
import { parseManualCoverLetterOutput } from "@/features/job-tracker/lib/parse-manual-cover-letter";

interface ApplicationCoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  initialSubject?: string;
  initialBody?: string;
}

export const ApplicationCoverLetterDialog: FC<
  ApplicationCoverLetterDialogProps
> = ({
  open,
  onOpenChange,
  applicationId,
  initialSubject = "",
  initialBody = "",
}) => {
  const t = useTranslations("admin.jobTracker.coverLetter");
  const utils = api.useUtils();
  const router = useRouter();

  const capabilities =
    api.jobTrackerAdmin.getApplicationEmailCapabilities.useQuery(undefined, {
      enabled: open,
    });

  const promptQuery =
    api.jobTrackerAdmin.getApplicationCoverLetterPrompt.useQuery(
      { applicationId },
      { enabled: open },
    );

  const hasAutoProviders = capabilities.data?.hasAiProvider ?? false;
  const providers = capabilities.data?.providers ?? [];
  const defaultProvider = capabilities.data?.defaultProvider ?? null;

  const [userMode, setUserMode] = useState<AiProcessingMode | null>(null);
  const [userProvider, setUserProvider] = useState<AiProviderName | null>(null);

  const mode: AiProcessingMode =
    userMode ?? (hasAutoProviders ? "auto" : "manual");
  const provider: AiProviderName | null = userProvider ?? defaultProvider;

  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [notes, setNotes] = useState<string | null>(null);
  const [manualJson, setManualJson] = useState("");

  const hasExistingContent = Boolean(
    initialSubject.trim() || initialBody.trim(),
  );
  const [showManualEditor, setShowManualEditor] = useState(hasExistingContent);

  const draftMutation =
    api.jobTrackerAdmin.draftApplicationCoverLetter.useMutation();
  const saveMutation =
    api.jobTrackerAdmin.saveApplicationCoverLetter.useMutation();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setSubject(initialSubject);
        setBody(initialBody);
        setNotes(null);
        setManualJson("");
        setShowManualEditor(
          Boolean(initialSubject.trim() || initialBody.trim()),
        );
        setUserMode(null);
        setUserProvider(null);
      }
      onOpenChange(next);
    },
    [initialBody, initialSubject, onOpenChange],
  );

  const handleLoadPrompt = useCallback(async () => {
    const res = await promptQuery.refetch();
    return res.data;
  }, [promptQuery]);

  const handleApplyManualResponse = useCallback(() => {
    if (!manualJson.trim()) return;
    const parsed = parseManualCoverLetterOutput(manualJson);
    if (!parsed.subject && !parsed.body) {
      toast.error(t("parseError"));
      return;
    }
    setSubject(parsed.subject);
    setBody(parsed.body);
    setShowManualEditor(true);
    toast.success(t("responseApplied"));
  }, [manualJson, t]);

  const handleDraftAuto = useCallback(() => {
    draftMutation.mutate(
      { applicationId, provider: provider ?? undefined },
      {
        onSuccess: (result) => {
          setSubject(result.subject);
          setBody(result.body);
          setNotes(result.notes ?? null);
          setShowManualEditor(true);
          toast.success(t("draftSuccess"));
          void utils.jobTrackerAdmin.getApplicationById.invalidate({
            id: applicationId,
          });
          router.refresh();
        },
        onError: (error) => {
          toast.error(t("draftError"), {
            description: `${error.message}. ${t("aiFailedFallback")}`,
          });
          setUserMode("manual");
        },
      },
    );
  }, [applicationId, draftMutation, provider, router, t, utils]);

  const handleSave = useCallback(() => {
    if (!subject.trim() || !body.trim()) {
      toast.error(t("saveMissingFields"));
      return;
    }
    saveMutation.mutate(
      {
        applicationId,
        subject: subject.trim(),
        body: body.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t("saveSuccess"));
          void utils.jobTrackerAdmin.getApplicationById.invalidate({
            id: applicationId,
          });
          router.refresh();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(t("saveError"), { description: error.message });
        },
      },
    );
  }, [
    applicationId,
    body,
    onOpenChange,
    router,
    saveMutation,
    subject,
    t,
    utils,
  ]);

  const handleCopyLetter = useCallback(async () => {
    const text = [subject.trim(), "", body.trim()].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyError"));
    }
  }, [body, subject, t]);

  const canSave = Boolean(subject.trim()) && Boolean(body.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent
        title={t("title")}
        description={t("description")}
        className="sm:max-w-2xl"
        footer={
          showManualEditor ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canSave}
                onClick={() => {
                  void handleCopyLetter();
                }}
              >
                <Copy className="mr-1.5 size-3.5" aria-hidden />
                {t("copy")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSave || saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending ? (
                  <Loader2
                    className="mr-1.5 size-3.5 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <Save className="mr-1.5 size-3.5" aria-hidden />
                )}
                {t("save")}
              </Button>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          {showManualEditor ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowManualEditor(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  <Wand2 className="mr-1.5 size-3.5" aria-hidden />
                  {t("aiOptions")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={draftMutation.isPending || !hasAutoProviders}
                  onClick={handleDraftAuto}
                >
                  {draftMutation.isPending ? (
                    <Loader2
                      className="mr-1.5 size-3.5 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <Sparkles
                      className="text-primary mr-1.5 size-3.5"
                      aria-hidden
                    />
                  )}
                  {t("redraft")}
                </Button>
              </div>

              {notes ? (
                <p className="text-muted-foreground bg-muted/40 rounded-md px-3 py-2 text-xs">
                  {notes}
                </p>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="app-cover-subject">{t("subjectLabel")}</Label>
                <Input
                  id="app-cover-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="app-cover-body">{t("bodyLabel")}</Label>
                <Textarea
                  id="app-cover-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="resize-y text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ResumeAiControls
                mode={mode}
                onModeChange={setUserMode}
                provider={provider}
                onProviderChange={setUserProvider}
                providers={providers}
                defaultProvider={defaultProvider}
                hasAutoProviders={hasAutoProviders}
                layout="compact"
              />

              {mode === "auto" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowManualEditor(true)}
                  >
                    <PenLine className="mr-1.5 size-3.5" aria-hidden />
                    {t("writeManually")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={draftMutation.isPending || !hasAutoProviders}
                    onClick={handleDraftAuto}
                  >
                    {draftMutation.isPending ? (
                      <Loader2
                        className="mr-1.5 size-3.5 animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <Sparkles className="mr-1.5 size-3.5" aria-hidden />
                    )}
                    {t("draft")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <ManualAiPanel
                    promptPackage={promptQuery.data}
                    isLoadingPrompt={promptQuery.isFetching}
                    onLoadPrompt={handleLoadPrompt}
                    rawJson={manualJson}
                    onRawJsonChange={setManualJson}
                    onSubmit={handleApplyManualResponse}
                    isPending={false}
                    submitLabel={t("applyResponse")}
                    canLoadPrompt={Boolean(applicationId)}
                    variant="compact"
                  />
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowManualEditor(true)}
                    >
                      <PenLine className="mr-1.5 size-3.5" aria-hidden />
                      {t("writeManually")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </FormDialogContent>
    </Dialog>
  );
};
