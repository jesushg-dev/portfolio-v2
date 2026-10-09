"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ResumeDocxUpload } from "@/features/resume-engine/components/resume-docx-upload";
import { ResumeTailorPreviewPanel } from "@/features/resume-engine/components/resume-tailor-preview-panel";
import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";

export interface ResumeTailorResultViewProps {
  previewFileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  structuredSnapshot: unknown;
  downloadUrl: string | null;
  pdfDownloadUrl: string | null;
  aiScore?: number | null;
  matchNotes?: string | null;
  matchAnalysis?: CvMatchAnalysis | null;
  exportId: string | null;
  applicationId?: string;
  embedded?: boolean;
  onResetTailor: () => void;
  onPolishedUpload: (file: {
    url: string;
    key: string;
    name: string;
    mimeType: string;
  }) => void;
}

export const ResumeTailorResultView: FC<ResumeTailorResultViewProps> = ({
  previewFileUrl,
  fileName,
  mimeType,
  structuredSnapshot,
  downloadUrl,
  pdfDownloadUrl,
  aiScore,
  matchNotes,
  matchAnalysis,
  exportId,
  applicationId,
  embedded = false,
  onResetTailor,
  onPolishedUpload,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [showReplaceFile, setShowReplaceFile] = useState(false);

  const canReplaceFile = Boolean(exportId ?? applicationId);

  const actions = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onResetTailor}>
        {embedded ? (
          <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
        ) : (
          <Upload className="mr-1.5 size-3.5" aria-hidden />
        )}
        {t(embedded ? "tailorRegenerate" : "tailorAgain")}
      </Button>

      {applicationId && !embedded ? (
        <Link
          href={{
            pathname: "/admin/job-tracker/applications/[id]",
            params: { id: applicationId },
          }}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
          })}
        >
          {t("tailorBackToApplication")}
        </Link>
      ) : null}

      {canReplaceFile && !showReplaceFile ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowReplaceFile(true)}
        >
          <Upload className="size-3.5" aria-hidden />
          {t("polishReplaceCta")}
        </Button>
      ) : null}
    </>
  );

  const belowToolbar = showReplaceFile ? (
    <div className="border-border rounded-md border p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-foreground text-xs font-medium">
          {t("polishUploadTitle")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-auto px-0 text-xs"
          onClick={() => setShowReplaceFile(false)}
        >
          {t("polishReplaceCancel")}
        </Button>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        {t("polishUploadHint")}
      </p>
      <ResumeDocxUpload
        allowPdf
        preferPdf
        resetKey={downloadUrl ?? exportId ?? "polish"}
        onUploaded={(file) => {
          onPolishedUpload(file);
          setShowReplaceFile(false);
        }}
        onError={(message) => {
          toast.error(t("polishUploadFailed"), { description: message });
        }}
      />
    </div>
  ) : null;

  return (
    <div className="mt-3">
      <ResumeTailorPreviewPanel
        fileUrl={previewFileUrl}
        fileName={fileName}
        mimeType={mimeType}
        structuredSnapshot={structuredSnapshot}
        downloadUrl={downloadUrl}
        pdfDownloadUrl={pdfDownloadUrl}
        aiScore={aiScore}
        matchNotes={matchNotes}
        matchAnalysis={matchAnalysis}
        actions={actions}
        belowToolbar={belowToolbar}
      />
    </div>
  );
};
