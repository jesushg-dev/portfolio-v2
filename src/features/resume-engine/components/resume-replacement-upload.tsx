"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useRouter } from "@/i18n/routing";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";

export function ResumeReplacementTrigger({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("admin.jobTracker.email");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-expanded={open}
      onClick={onToggle}
    >
      {t("replaceAttachment")}
    </Button>
  );
}

export function ResumeReplacementUpload({
  applicationId,
  onComplete,
}: {
  applicationId: string;
  onComplete: () => void;
}) {
  const t = useTranslations("admin.jobTracker.email");
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const upload = api.integrationsAdmin.uploadFile.useMutation();
  const update = api.jobTrackerAdmin.updateApplication.useMutation();
  const utils = api.useUtils();
  const router = useRouter();
  const replace = async (file?: File) => {
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name) || file.size > 8 * 1024 * 1024) {
      toast.error(t("replacementInvalid"));
      return;
    }
    setPending(true);
    try {
      const uploaded = await upload.mutateAsync({
        fileName: file.name,
        mimeType: file.name.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataBase64: await fileToBase64(file),
      });
      await update.mutateAsync({
        id: applicationId,
        cvFile: { url: uploaded.url, name: file.name, uploadedAt: new Date() },
      });
      await utils.resumeEngineAdmin.getTailorPageData.invalidate({
        applicationId,
      });
      router.refresh();
      onComplete();
      toast.success(t("attachmentReplaced"));
    } catch (error) {
      toast.error(t("attachmentUploadError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <section
      className="border-border bg-muted/30 space-y-3 rounded-xl border-2 border-dashed p-5"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (!pending) void replace(event.dataTransfer.files[0]);
      }}
    >
      <h3 className="text-sm font-semibold">{t("replacementTitle")}</h3>
      <p className="text-muted-foreground text-sm">
        {t("replacementDropHint")}
      </p>
      <p className="text-muted-foreground text-xs">{t("replacementHint")}</p>
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx"
        className="sr-only"
        aria-label={t("replacementTitle")}
        onChange={(event) => void replace(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => input.current?.click()}
      >
        {t("replaceAttachment")}
      </Button>
    </section>
  );
}
