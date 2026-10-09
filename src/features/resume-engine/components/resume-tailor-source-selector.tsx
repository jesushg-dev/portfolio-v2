"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResumeDocxUpload } from "@/features/resume-engine/components/resume-docx-upload";
import { cn } from "@/lib/utils";

export type ResumeTailorSourceType = "studio" | "upload";

export interface ResumeTailorSourceSelectorProps {
  sourceType: ResumeTailorSourceType;
  onSourceTypeChange: (source: ResumeTailorSourceType) => void;
  hasStudioData: boolean;
  studioPreview?: {
    fullName: string;
    experienceCount: number;
  } | null;
  uploads: { id: string; fileName: string }[];
  uploadId: string | null;
  onUploadIdChange: (id: string) => void;
  onUploadComplete: (file: {
    url: string;
    key: string;
    name: string;
    mimeType?: string;
  }) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

function sourceOptionClass(active: boolean, disabled = false) {
  return cn(
    "flex flex-col gap-0.5 rounded-md border p-2.5 text-left transition-colors",
    active
      ? "border-primary bg-primary/5"
      : "border-border bg-background hover:bg-muted/50",
    disabled && "cursor-not-allowed opacity-50",
  );
}

export const ResumeTailorSourceSelector: FC<
  ResumeTailorSourceSelectorProps
> = ({
  sourceType,
  onSourceTypeChange,
  hasStudioData,
  studioPreview,
  uploads,
  uploadId,
  onUploadIdChange,
  onUploadComplete,
  onError,
  compact = false,
}) => {
  const t = useTranslations("admin.resumeStudio");

  return (
    <div className={compact ? "mb-5" : "flex flex-col gap-4"}>
      {compact ? (
        <p className="text-foreground mb-2 text-sm font-medium">
          {t("tailorSourceTitle")}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onSourceTypeChange("studio")}
          disabled={!hasStudioData}
          className={sourceOptionClass(sourceType === "studio", !hasStudioData)}
        >
          <span
            className={cn(
              "font-medium",
              compact ? "text-xs sm:text-sm" : "text-sm",
              sourceType === "studio" && compact && "text-primary",
            )}
          >
            {t("tailorSourceStudio")}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {hasStudioData && studioPreview
              ? t("tailorSourceStudioHint", {
                  name: studioPreview.fullName,
                  count: studioPreview.experienceCount,
                })
              : t("tailorSourceStudioEmpty")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSourceTypeChange("upload")}
          className={sourceOptionClass(sourceType === "upload")}
        >
          <span
            className={cn(
              "font-medium",
              compact ? "text-xs sm:text-sm" : "text-sm",
              sourceType === "upload" && compact && "text-primary",
            )}
          >
            {t("tailorSourceUpload")}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {t("tailorSourceUploadHint")}
          </span>
        </button>
      </div>

      {sourceType === "upload" ? (
        <div className="mt-3 flex flex-col gap-3">
          {uploads.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>{t("tailorRecentUploads")}</Label>
              <div className="flex flex-wrap gap-2">
                {uploads.map((upload) => (
                  <Button
                    key={upload.id}
                    type="button"
                    size="sm"
                    variant={uploadId === upload.id ? "default" : "outline"}
                    onClick={() => onUploadIdChange(upload.id)}
                  >
                    {upload.fileName}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <ResumeDocxUpload
            allowPdf
            resetKey={uploadId ?? "new"}
            onUploaded={(file) => {
              onUploadComplete(file);
            }}
            onError={(message) => {
              onError(message);
              toast.error(t("uploadFailed"), { description: message });
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
