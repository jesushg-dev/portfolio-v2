"use client";

import type { FC } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { FileUpload, type FileUploadLabels } from "@/components/file-upload";
import { UploadThingRequiredNotice } from "@/features/integrations/components/uploadthing-required-notice";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";
import { api } from "@/trpc/react";

export interface ResumeDocxUploadResult {
  url: string;
  key: string;
  name: string;
  mimeType: string;
}

interface ResumeDocxUploadInnerProps {
  onUploaded: (file: ResumeDocxUploadResult) => void | Promise<void>;
  onError?: (message: string) => void;
  allowPdf?: boolean;
  preferPdf?: boolean;
}

const ResumeDocxUploadInner: FC<ResumeDocxUploadInnerProps> = ({
  onUploaded,
  onError,
  allowPdf = false,
  preferPdf = false,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [isPending, startTransition] = useTransition();
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const configs = api.integrationsAdmin.getConfigs.useQuery();
  const uploadFile = api.integrationsAdmin.uploadFile.useMutation();
  const uploadEnabled = configs.data?.uploadthing.isConfigured ?? false;
  const accept = preferPdf
    ? ".pdf,.docx"
    : allowPdf
      ? ".doc,.docx,.pdf"
      : ".doc,.docx";

  const labels: FileUploadLabels = {
    dropzoneTitle: t("fileUploadDropzoneTitle"),
    dropzoneHint: t("fileUploadDropzoneHint", {
      accept,
      maxSize: 8,
    }),
    view: t("fileUploadView"),
    fileTooLargeTitle: t("fileUploadTooLarge"),
    fileTooLargeDescription: t("fileUploadTooLargeHint", { maxSize: 8 }),
    invalidTypeTitle: t("fileUploadInvalidType"),
    invalidTypeDescription: t("fileUploadInvalidTypeHint", {
      accept,
    }),
    selectedTitle: t("fileUploadSelected"),
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      startTransition(async () => {
        try {
          const dataBase64 = await fileToBase64(file);
          const uploaded = await uploadFile.mutateAsync({
            fileName: file.name,
            mimeType:
              file.type ||
              (file.name.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            dataBase64,
          });

          const payload: ResumeDocxUploadResult = {
            url: uploaded.url,
            key: uploaded.key,
            name: file.name,
            mimeType:
              file.type ||
              (file.name.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
          };

          setCurrentFile({ name: payload.name, url: payload.url });
          await onUploaded(payload);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("uploadFailed");
          onError?.(message);
        }
      });
    },
    [onError, onUploaded, t, uploadFile],
  );

  if (configs.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="text-primary size-4 animate-spin" />
        {t("uploadCheckingStorage")}
      </div>
    );
  }

  if (!uploadEnabled) {
    return <UploadThingRequiredNotice />;
  }

  if (isPending || uploadFile.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="text-primary size-4 animate-spin" />
        {t("fileUploading")}
      </div>
    );
  }

  return (
    <FileUpload
      accept={accept}
      maxSize={8}
      labels={labels}
      showSelectionToast={false}
      onFileSelect={handleFileSelect}
      currentFile={currentFile ?? undefined}
      onFileRemove={() => setCurrentFile(null)}
    />
  );
};

interface ResumeDocxUploadProps {
  onUploaded: (file: ResumeDocxUploadResult) => void | Promise<void>;
  onError?: (message: string) => void;
  resetKey?: string | number;
  allowPdf?: boolean;
  preferPdf?: boolean;
}

export const ResumeDocxUpload: FC<ResumeDocxUploadProps> = ({
  onUploaded,
  onError,
  resetKey = "default",
  allowPdf = false,
  preferPdf = false,
}) => (
  <ResumeDocxUploadInner
    key={resetKey}
    onUploaded={onUploaded}
    onError={onError}
    allowPdf={allowPdf}
    preferPdf={preferPdf}
  />
);
