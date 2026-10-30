"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Upload } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ResumeTailorPreviewPanel } from "@/features/resume-engine/components/resume-tailor-preview-panel";
import {
  ResumeReplacementTrigger,
  ResumeReplacementUpload,
} from "./resume-replacement-upload";
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
  manuallyCorrected?: boolean;
  onResetTailor: () => void;
  onPdfGenerated?: (pdfUrl: string) => void;
  onSendCv?: () => void;
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
  manuallyCorrected = false,
  onResetTailor,
  onPdfGenerated,
  onSendCv,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [replacementOpen, setReplacementOpen] = useState(false);
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
      {onSendCv ? (
        <Button type="button" size="sm" onClick={onSendCv}>
          {t("tailorSendCv")}
        </Button>
      ) : null}

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
    </>
  );

  return (
    <div className="space-y-4">
      {embedded ? (
        <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
          <div className="min-w-0 flex-1">
            <p className="text-primary text-sm font-medium">
              {t(
                manuallyCorrected
                  ? "tailorManuallyCorrected"
                  : "tailorAlreadyDone",
              )}
            </p>
            {fileName ? (
              <p
                className="text-muted-foreground mt-1 truncate text-xs"
                title={fileName}
              >
                {fileName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      ) : null}
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
        exportId={exportId}
        onPdfGenerated={onPdfGenerated}
        onImprove={onResetTailor}
        actions={
          <>
            {!embedded ? actions : null}
            {applicationId ? (
              <ResumeReplacementTrigger
                open={replacementOpen}
                onToggle={() => setReplacementOpen((value) => !value)}
              />
            ) : null}
          </>
        }
        belowToolbar={
          applicationId && replacementOpen ? (
            <ResumeReplacementUpload
              applicationId={applicationId}
              onComplete={() => setReplacementOpen(false)}
            />
          ) : undefined
        }
      />
    </div>
  );
};
