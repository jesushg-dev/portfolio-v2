"use client";

import { useCallback, useRef, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { FileUp, Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";

interface ApplicationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  hasCvFile: boolean;
  cvFileName?: string | null;
}

interface OverrideAttachment {
  url: string;
  name: string;
}

export const ApplicationEmailDialog: FC<ApplicationEmailDialogProps> = ({
  open,
  onOpenChange,
  applicationId,
  hasCvFile,
  cvFileName,
}) => {
  const t = useTranslations("admin.jobTracker.email");
  const utils = api.useUtils();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capabilities =
    api.jobTrackerAdmin.getApplicationEmailCapabilities.useQuery(undefined, {
      enabled: open,
    });

  const [toEmail, setToEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [drafted, setDrafted] = useState(false);
  const [overrideAttachment, setOverrideAttachment] =
    useState<OverrideAttachment | null>(null);

  const draftMutation = api.jobTrackerAdmin.draftApplicationEmail.useMutation();
  const sendMutation = api.jobTrackerAdmin.sendApplicationEmail.useMutation();
  const uploadFile = api.integrationsAdmin.uploadFile.useMutation();

  const activeAttachmentName =
    overrideAttachment?.name ?? cvFileName ?? "CV.docx";
  const hasAttachment = Boolean(overrideAttachment ?? hasCvFile);

  const handleDraft = useCallback(() => {
    draftMutation.mutate(
      { applicationId },
      {
        onSuccess: (result) => {
          setToEmail(result.applyToEmail ?? "");
          setRecipientName(result.recipientName ?? "");
          setSubject(result.subject);
          setBody(result.body);
          setNotes(result.notes ?? null);
          setDrafted(true);
          toast.success(t("draftSuccess"));
        },
        onError: (error) => {
          toast.error(t("draftError"), { description: error.message });
        },
      },
    );
  }, [applicationId, draftMutation, t]);

  const handleReplaceAttachment = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const lower = file.name.toLowerCase();
      const isDoc =
        lower.endsWith(".doc") ||
        lower.endsWith(".docx") ||
        lower.endsWith(".pdf");
      if (!isDoc) {
        toast.error(t("attachmentInvalidType"));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(t("attachmentTooLarge"));
        return;
      }

      try {
        const dataBase64 = await fileToBase64(file);
        const uploaded = await uploadFile.mutateAsync({
          fileName: file.name,
          mimeType:
            file.type ||
            (lower.endsWith(".pdf")
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
          dataBase64,
        });
        setOverrideAttachment({ url: uploaded.url, name: file.name });
        toast.success(t("attachmentReplaced"));
      } catch (error) {
        toast.error(t("attachmentUploadError"), {
          description:
            error instanceof Error ? error.message : t("attachmentUploadError"),
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [t, uploadFile],
  );

  const handleSend = useCallback(() => {
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      toast.error(t("sendMissingFields"));
      return;
    }
    if (!hasAttachment) {
      toast.error(t("needCv"));
      return;
    }
    sendMutation.mutate(
      {
        applicationId,
        toEmail: toEmail.trim(),
        subject: subject.trim(),
        body: body.trim(),
        recipientName: recipientName.trim() || undefined,
        ...(overrideAttachment
          ? {
              attachmentUrl: overrideAttachment.url,
              attachmentName: overrideAttachment.name,
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("sendSuccess"));
          void Promise.all([
            utils.jobTrackerAdmin.getApplicationById.invalidate({
              id: applicationId,
            }),
            utils.jobTrackerAdmin.getApplications.invalidate(),
          ]).then(() => {
            router.refresh();
            onOpenChange(false);
          });
        },
        onError: (error) => {
          toast.error(t("sendError"), { description: error.message });
        },
      },
    );
  }, [
    applicationId,
    body,
    hasAttachment,
    onOpenChange,
    overrideAttachment,
    recipientName,
    router,
    sendMutation,
    subject,
    t,
    toEmail,
    utils.jobTrackerAdmin.getApplicationById,
    utils.jobTrackerAdmin.getApplications,
  ]);

  const canDraft = capabilities.data?.hasAiProvider ?? false;
  const canSend =
    hasAttachment &&
    (capabilities.data?.canSendEmail ?? false) &&
    drafted &&
    Boolean(toEmail.trim()) &&
    !uploadFile.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
          {!capabilities.data?.hasAiProvider ? (
            <p className="text-muted-foreground text-sm">{t("noAi")}</p>
          ) : null}
          {!capabilities.data?.canSendEmail ? (
            <p className="text-muted-foreground text-sm">{t("noResend")}</p>
          ) : null}

          <div className="border-border space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">{t("attachmentLabel")}</p>
            {hasAttachment ? (
              <p className="text-muted-foreground flex items-start gap-2 text-xs">
                <Paperclip className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  {overrideAttachment
                    ? t("attachmentOverride", { name: activeAttachmentName })
                    : t("attachment", { name: activeAttachmentName })}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">{t("needCv")}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  void handleReplaceAttachment(e.target.files?.[0]);
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadFile.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile.isPending ? (
                  <Loader2
                    className="mr-1.5 size-3.5 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <FileUp className="mr-1.5 size-3.5" aria-hidden />
                )}
                {t("replaceAttachment")}
              </Button>
              {overrideAttachment ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOverrideAttachment(null)}
                >
                  <X className="mr-1.5 size-3.5" aria-hidden />
                  {t("useTailoredCv")}
                </Button>
              ) : null}
            </div>
          </div>

          {drafted ? (
            <div className="space-y-3">
              {notes ? (
                <p className="text-muted-foreground bg-muted/40 rounded-md px-3 py-2 text-xs">
                  {notes}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="app-email-to">{t("toLabel")}</Label>
                  <Input
                    id="app-email-to"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-email-name">{t("recipientLabel")}</Label>
                  <Input
                    id="app-email-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t("recipientPlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-email-subject">{t("subjectLabel")}</Label>
                <Input
                  id="app-email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-email-body">{t("bodyLabel")}</Label>
                <Textarea
                  id="app-email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="resize-y text-sm"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("draftHint")}</p>
          )}
        </div>

        <DialogFooter className="border-border gap-2 border-t pt-4 sm:justify-between">
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
          <Button
            type="button"
            size="sm"
            disabled={!canSend || sendMutation.isPending}
            onClick={handleSend}
          >
            {sendMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="mr-1.5 size-3.5" aria-hidden />
            )}
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
