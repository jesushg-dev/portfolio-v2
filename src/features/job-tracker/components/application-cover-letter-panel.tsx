"use client";

import { useCallback, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/shared/form-dialog-content";
import { useRouter } from "@/i18n/routing";

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

  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [notes, setNotes] = useState<string | null>(null);
  const [drafted, setDrafted] = useState(
    () => initialSubject.trim().length > 0 && initialBody.trim().length > 0,
  );

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
        setDrafted(
          initialSubject.trim().length > 0 && initialBody.trim().length > 0,
        );
      }
      onOpenChange(next);
    },
    [initialBody, initialSubject, onOpenChange],
  );

  const handleDraft = useCallback(() => {
    draftMutation.mutate(
      { applicationId },
      {
        onSuccess: (result) => {
          setSubject(result.subject);
          setBody(result.body);
          setNotes(result.notes ?? null);
          setDrafted(true);
          toast.success(t("draftSuccess"));
          void utils.jobTrackerAdmin.getApplicationById.invalidate({
            id: applicationId,
          });
          router.refresh();
        },
        onError: (error) => {
          toast.error(t("draftError"), { description: error.message });
        },
      },
    );
  }, [applicationId, draftMutation, router, t, utils]);

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

  const handleCopy = useCallback(async () => {
    const text = [subject.trim(), "", body.trim()].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyError"));
    }
  }, [body, subject, t]);

  const canDraft = capabilities.data?.hasAiProvider ?? false;
  const canSave = drafted && Boolean(subject.trim()) && Boolean(body.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent
        title={t("title")}
        description={t("description")}
        className="sm:max-w-2xl"
        footer={
          <DialogFooter className="gap-2 border-0 bg-transparent p-0 sm:justify-between">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canDraft || draftMutation.isPending}
              onClick={handleDraft}
            >
              {draftMutation.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-1.5 size-3.5" aria-hidden />
              )}
              {drafted ? t("redraft") : t("draft")}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canSave}
                onClick={() => {
                  void handleCopy();
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
          </DialogFooter>
        }
      >
        <div className="space-y-3">
          {!capabilities.data?.hasAiProvider ? (
            <p className="text-muted-foreground text-sm">{t("noAi")}</p>
          ) : null}

          {drafted ? (
            <div className="space-y-3">
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
                  rows={14}
                  className="resize-y text-sm"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("draftHint")}</p>
          )}
        </div>
      </FormDialogContent>
    </Dialog>
  );
};
