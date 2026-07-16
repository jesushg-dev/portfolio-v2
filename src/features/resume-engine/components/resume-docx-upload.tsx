"use client";

import type { FC } from "react";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { FileUpload, type FileUploadLabels } from "@/components/file-upload";
import { useUploadThing } from "@/lib/uploadthing";

export interface ResumeDocxUploadResult {
  url: string;
  key: string;
  name: string;
  mimeType: string;
}

interface ResumeDocxUploadInnerProps {
  onUploaded: (file: ResumeDocxUploadResult) => void | Promise<void>;
  onError?: (message: string) => void;
}

const ResumeDocxUploadInner: FC<ResumeDocxUploadInnerProps> = ({
  onUploaded,
  onError,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [isPending, startTransition] = useTransition();
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const { startUpload, isUploading } = useUploadThing("resumeImporter");

  const labels: FileUploadLabels = {
    dropzoneTitle: t("fileUploadDropzoneTitle"),
    dropzoneHint: t("fileUploadDropzoneHint", {
      accept: ".doc,.docx",
      maxSize: 8,
    }),
    view: t("fileUploadView"),
    fileTooLargeTitle: t("fileUploadTooLarge"),
    fileTooLargeDescription: t("fileUploadTooLargeHint", { maxSize: 8 }),
    invalidTypeTitle: t("fileUploadInvalidType"),
    invalidTypeDescription: t("fileUploadInvalidTypeHint", {
      accept: ".doc,.docx",
    }),
    selectedTitle: t("fileUploadSelected"),
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      startTransition(async () => {
        try {
          const uploaded = await startUpload([file]);
          const result = uploaded?.[0];
          if (!result) {
            onError?.(t("uploadFailed"));
            return;
          }

          const url = result.ufsUrl ?? result.url;
          const payload: ResumeDocxUploadResult = {
            url,
            key: result.key,
            name: result.name,
            mimeType:
              file.type ||
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          };

          setCurrentFile({ name: payload.name, url });
          await onUploaded(payload);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t("uploadFailed");
          onError?.(message);
        }
      });
    },
    [onError, onUploaded, startUpload, t],
  );

  if (isUploading || isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="text-primary size-4 animate-spin" />
        {t("fileUploading")}
      </div>
    );
  }

  return (
    <FileUpload
      accept=".doc,.docx"
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
}

export const ResumeDocxUpload: FC<ResumeDocxUploadProps> = ({
  onUploaded,
  onError,
  resetKey = "default",
}) => (
  <ResumeDocxUploadInner
    key={resetKey}
    onUploaded={onUploaded}
    onError={onError}
  />
);
