"use client";

import { type FC } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Upload } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
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
  onPdfGenerated?: (pdfUrl: string) => void;
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
  onPdfGenerated,
}) => {
  const t = useTranslations("admin.resumeStudio");
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
    </>
  );

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
        exportId={exportId}
        onPdfGenerated={onPdfGenerated}
        actions={actions}
      />
    </div>
  );
};
