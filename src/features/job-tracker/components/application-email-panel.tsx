"use client";

import { useCallback, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { FileUp, Loader2, Paperclip, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import {
  FormActions,
  FormCheckboxItem,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import { FormDialogContent } from "@/components/shared/form-dialog-content";
import { useRouter } from "@/i18n/routing";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";
import type { Locale } from "@/i18n/config";

const applicationEmailSchema = z.object({
  toEmail: z.string().trim().email().max(120),
  recipientName: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  trackOpens: z.boolean(),
  sendCopy: z.boolean(),
});

type ApplicationEmailFormValues = z.infer<typeof applicationEmailSchema>;

interface OverrideAttachment {
  url: string;
  name: string;
}

type EmailTranslation = ReturnType<
  typeof useTranslations<"admin.jobTracker.email">
>;

interface ApplicationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  hasCvFile: boolean;
  cvFileName?: string | null;
  locale: Locale;
}

export function ApplicationEmailDialog({
  open,
  onOpenChange,
  applicationId,
  hasCvFile,
  cvFileName,
  locale,
}: ApplicationEmailDialogProps) {
  const t = useTranslations("admin.jobTracker.email");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        title={t("title")}
        description={t("description")}
        className="sm:max-w-xl"
      >
        {open ? (
          <ApplicationEmailForm
            t={t}
            applicationId={applicationId}
            hasCvFile={hasCvFile}
            cvFileName={cvFileName}
            locale={locale}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </FormDialogContent>
    </Dialog>
  );
}

interface ApplicationEmailFormProps {
  t: EmailTranslation;
  applicationId: string;
  hasCvFile: boolean;
  cvFileName?: string | null;
  locale: Locale;
  onClose: () => void;
}

export function ApplicationEmailForm({
  t,
  applicationId,
  hasCvFile,
  cvFileName,
  locale,
  onClose,
}: ApplicationEmailFormProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capabilities =
    api.jobTrackerAdmin.getApplicationEmailCapabilities.useQuery();
  const draftMutation = api.jobTrackerAdmin.draftApplicationEmail.useMutation();
  const sendMutation = api.jobTrackerAdmin.sendApplicationEmail.useMutation();
  const uploadFile = api.integrationsAdmin.uploadFile.useMutation();

  const [notes, setNotes] = useState<string | null>(null);
  const [drafted, setDrafted] = useState(true);
  const [overrideAttachment, setOverrideAttachment] =
    useState<OverrideAttachment | null>(null);

  const activeAttachmentName =
    overrideAttachment?.name ?? cvFileName ?? "CV.docx";
  const hasAttachment = Boolean(overrideAttachment ?? hasCvFile);

  const form = useForm<ApplicationEmailFormValues>({
    resolver: zodResolver(applicationEmailSchema),
    defaultValues: {
      toEmail: "",
      recipientName: "",
      subject: "",
      body: "",
      trackOpens: true,
      sendCopy: true,
    },
  });

  const handleDraft = useCallback(() => {
    draftMutation.mutate(
      { applicationId },
      {
        onSuccess: (result) => {
          form.reset({
            toEmail: result.applyToEmail ?? form.getValues("toEmail") ?? "",
            recipientName:
              result.recipientName ?? form.getValues("recipientName") ?? "",
            subject: result.subject,
            body: result.body,
            trackOpens: true,
            sendCopy: true,
          });
          setNotes(result.notes ?? null);
          setDrafted(true);
          toast.success(t("draftSuccess"));
        },
        onError: (error) => {
          toast.error(t("draftError"), { description: error.message });
        },
      },
    );
  }, [applicationId, draftMutation, form, t]);

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

  const handleSubmit = useCallback(
    (values: ApplicationEmailFormValues) => {
      if (!hasAttachment) {
        toast.error(t("needCv"));
        return;
      }

      const trimmedRecipientName = values.recipientName?.trim();
      sendMutation.mutate(
        {
          applicationId,
          toEmail: values.toEmail.trim(),
          subject: values.subject.trim(),
          body: values.body.trim(),
          recipientName:
            trimmedRecipientName && trimmedRecipientName.length > 0
              ? trimmedRecipientName
              : undefined,
          trackOpens: values.trackOpens,
          sendCopy: values.sendCopy,
          locale,
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
              utils.jobTrackerAdmin.getApplicationEmailHistory.invalidate({
                applicationId,
              }),
            ]).then(() => {
              router.refresh();
              onClose();
            });
          },
          onError: (error) => {
            toast.error(t("sendError"), { description: error.message });
          },
        },
      );
    },
    [
      applicationId,
      hasAttachment,
      locale,
      onClose,
      overrideAttachment,
      router,
      sendMutation,
      t,
      utils,
    ],
  );

  const canDraft = capabilities.data?.hasAiProvider ?? false;
  const watchToEmail = useWatch({ control: form.control, name: "toEmail" });
  const canSend =
    hasAttachment &&
    (capabilities.data?.canSendEmail ?? false) &&
    drafted &&
    Boolean(watchToEmail?.trim()) &&
    !uploadFile.isPending;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={sendMutation.error}>
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
            <div className="space-y-4">
              {notes ? (
                <p className="text-muted-foreground bg-muted/40 rounded-md px-3 py-2 text-xs">
                  {notes}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="toEmail"
                  render={({ field }) => (
                    <FormItem
                      label={t("toLabel")}
                      inputId="app-email-to"
                      required
                    >
                      <Input
                        id="app-email-to"
                        type="email"
                        placeholder="recruiter@company.com"
                        {...field}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem
                      label={t("recipientLabel")}
                      inputId="app-email-name"
                    >
                      <Input
                        id="app-email-name"
                        placeholder={t("recipientPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem
                    label={t("subjectLabel")}
                    inputId="app-email-subject"
                    required
                  >
                    <Input id="app-email-subject" {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem
                    label={t("bodyLabel")}
                    inputId="app-email-body"
                    required
                  >
                    <Textarea
                      id="app-email-body"
                      rows={8}
                      className="resize-y text-sm"
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendCopy"
                render={({ field }) => (
                  <FormCheckboxItem
                    label={t("sendCopyLabel")}
                    description={t("sendCopyHint")}
                  >
                    <Checkbox
                      id="app-email-send-copy"
                      aria-label={t("sendCopyLabel")}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormCheckboxItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackOpens"
                render={({ field }) => (
                  <FormCheckboxItem
                    label={t("trackOpensLabel")}
                    description={t("trackOpensHint")}
                  >
                    <Checkbox
                      id="app-email-track-opens"
                      aria-label={t("trackOpensLabel")}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormCheckboxItem>
                )}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("draftHint")}</p>
          )}
        </FormContent>

        <FormActions
          isPending={sendMutation.isPending}
          disabled={!canSend || sendMutation.isPending}
          title={t("send")}
          submitId="app-email-submit"
          className="sm:justify-between"
        >
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
        </FormActions>
      </FormRoot>
    </Form>
  );
}
