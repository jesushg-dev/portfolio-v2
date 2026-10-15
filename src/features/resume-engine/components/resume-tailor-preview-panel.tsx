"use client";

import { useState, type FC, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChartColumn, ChevronDown, Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  OfficeDocumentPreview,
  PdfFilePreview,
} from "@/components/shared/office-document-preview";
import { isPdfResumeFile } from "@/features/resume-engine/lib/parse-pdf-for-import";
import { TailoredAtsPreview } from "@/features/resume-engine/components/tailored-ats-preview";
import { ResumeMatchChecklist } from "@/features/resume-engine/components/resume-match-checklist";
import { ResumeAtsCheckerSummary } from "@/features/resume-engine/components/resume-ats-checker-summary";
import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";

type PreviewMode = "word" | "pdf" | "ats" | "match";

interface ResumeTailorPreviewPanelProps {
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  structuredSnapshot: unknown;
  downloadUrl: string | null;
  pdfDownloadUrl: string | null;
  aiScore?: number | null;
  matchNotes?: string | null;
  matchAnalysis?: CvMatchAnalysis | null;
  actions?: ReactNode;
  belowToolbar?: ReactNode;
}

function firstNonEmpty(
  ...values: (string | null | undefined)[]
): string | null {
  for (const value of values) {
    if (value != null && value.length > 0) return value;
  }
  return null;
}
function resolvePreviewMode(
  requested: PreviewMode,
  hasWord: boolean,
  hasPdf: boolean,
  hasAts: boolean,
  hasMatch: boolean,
): PreviewMode {
  if (requested === "word" && hasWord) return "word";
  if (requested === "pdf" && hasPdf) return "pdf";
  if (requested === "ats" && hasAts) return "ats";
  if (requested === "match" && hasMatch) return "match";
  if (hasWord) return "word";
  if (hasPdf) return "pdf";
  if (hasAts) return "ats";
  return "match";
}

export const ResumeTailorPreviewPanel: FC<ResumeTailorPreviewPanelProps> = ({
  fileUrl,
  fileName,
  mimeType,
  structuredSnapshot,
  downloadUrl,
  pdfDownloadUrl,
  aiScore = null,
  matchNotes = null,
  matchAnalysis = null,
  actions,
  belowToolbar,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const primaryUrl = firstNonEmpty(downloadUrl, fileUrl);
  const exportIsPdf = isPdfResumeFile({
    url: primaryUrl,
    fileName,
    mimeType,
  });
  const wordUrl = exportIsPdf ? null : primaryUrl;
  const pdfUrl = exportIsPdf
    ? firstNonEmpty(pdfDownloadUrl, primaryUrl)
    : pdfDownloadUrl;
  const hasAts = Boolean(structuredSnapshot);
  const hasWord = Boolean(wordUrl);
  const hasPdf = Boolean(pdfUrl);
  const noteItems =
    matchNotes
      ?.split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean) ?? [];
  const hasMatch = Boolean(
    aiScore != null ||
    (matchNotes != null && matchNotes.length > 0) ||
    (matchAnalysis &&
      (matchAnalysis.keywords.length > 0 ||
        matchAnalysis.mustHaves.length > 0 ||
        matchAnalysis.niceToHaves.length > 0 ||
        matchAnalysis.skillGaps.length > 0 ||
        matchAnalysis.touchedBlocks.length > 0 ||
        matchAnalysis.notes)),
  );

  const defaultMode: PreviewMode =
    exportIsPdf && hasPdf
      ? "pdf"
      : hasWord
        ? "word"
        : hasPdf
          ? "pdf"
          : hasMatch
            ? "match"
            : "ats";
  const previewSource = `${exportIsPdf ? "pdf" : "doc"}:${primaryUrl ?? ""}`;
  const [userMode, setUserMode] = useState<PreviewMode | null>(null);
  const [modeSource, setModeSource] = useState(previewSource);
  if (modeSource !== previewSource) {
    setModeSource(previewSource);
    setUserMode(null);
  }
  const requestedMode = userMode ?? defaultMode;

  const mode = resolvePreviewMode(
    requestedMode,
    hasWord,
    hasPdf,
    hasAts,
    hasMatch,
  );

  const triggerDownload = async (url: string, targetFilename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download request failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = targetFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = targetFilename;
      link.target = "_self";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const docxFilename = fileName
    ? fileName.toLowerCase().endsWith(".docx")
      ? fileName
      : `${fileName.replace(/\.[^/.]+$/, "")}.docx`
    : "tailored-cv.docx";

  const pdfFilename = fileName
    ? fileName.toLowerCase().endsWith(".pdf")
      ? fileName
      : `${fileName.replace(/\.[^/.]+$/, "")}.pdf`
    : "tailored-cv.pdf";

  const previewLabel =
    mode === "pdf"
      ? t("tailorPreviewPdf")
      : mode === "ats"
        ? t("tailorPreviewAts")
        : mode === "match"
          ? t("atsCheckerTitle")
          : t("tailorPreviewWord");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" size="sm" variant="outline">
                <Eye className="size-3.5" aria-hidden />
                {t("tailorPreviewMenu")}: {previewLabel}
                <ChevronDown className="size-3.5" aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="min-w-44">
            <DropdownMenuItem
              disabled={!hasWord}
              onClick={() => setUserMode("word")}
            >
              {t("tailorPreviewWord")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasPdf}
              onClick={() => setUserMode("pdf")}
            >
              {t("tailorPreviewPdf")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasAts}
              onClick={() => setUserMode("ats")}
            >
              {t("tailorPreviewAts")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasMatch}
              onClick={() => setUserMode("match")}
            >
              {t("atsCheckerTitle")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasMatch ? (
          <Button
            type="button"
            size="sm"
            variant={mode === "match" ? "default" : "outline"}
            aria-pressed={mode === "match"}
            onClick={() =>
              setUserMode((prev) => {
                const current = prev ?? defaultMode;
                return current === "match"
                  ? hasWord
                    ? "word"
                    : hasPdf
                      ? "pdf"
                      : "ats"
                  : "match";
              })
            }
          >
            <ChartColumn className="size-3.5" aria-hidden />
            {aiScore != null
              ? t("atsCheckerScore", { score: Math.round(aiScore) })
              : t("atsCheckerTitle")}
          </Button>
        ) : null}

        {hasWord && hasPdf ? (
          <div className="inline-flex rounded-md shadow-xs">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-r-none border-r-0"
              onClick={() => {
                if (wordUrl) void triggerDownload(wordUrl, docxFilename);
              }}
            >
              <Download className="mr-1.5 size-3.5" aria-hidden />
              {t("tailorDownloadDocx")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-l-none px-2"
                    aria-label={t("tailorDownloadMenu")}
                  >
                    <ChevronDown className="size-3.5" aria-hidden />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  onClick={() => {
                    if (wordUrl) void triggerDownload(wordUrl, docxFilename);
                  }}
                >
                  <Download className="mr-1.5 size-3.5" aria-hidden />
                  {t("tailorDownloadDocx")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (pdfUrl) void triggerDownload(pdfUrl, pdfFilename);
                  }}
                >
                  <Download className="mr-1.5 size-3.5" aria-hidden />
                  {t("tailorDownloadPdf")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!hasWord && !hasPdf}
            onClick={() => {
              if (wordUrl) void triggerDownload(wordUrl, docxFilename);
              else if (pdfUrl) void triggerDownload(pdfUrl, pdfFilename);
            }}
          >
            <Download className="mr-1.5 size-3.5" aria-hidden />
            {hasPdf && !hasWord
              ? t("tailorDownloadPdf")
              : t("tailorDownloadDocx")}
          </Button>
        )}

        {actions}
      </div>

      {belowToolbar}

      {hasMatch ? (
        <ResumeAtsCheckerSummary
          aiScore={aiScore}
          matchNotes={matchNotes}
          matchAnalysis={matchAnalysis}
        />
      ) : null}

      {mode === "word" && wordUrl ? (
        <OfficeDocumentPreview
          fileUrl={wordUrl}
          title={t("tailorPreviewTitle")}
        />
      ) : null}

      {mode === "pdf" && pdfUrl ? (
        <PdfFilePreview fileUrl={pdfUrl} title={t("tailorPreviewPdf")} />
      ) : null}

      {mode === "ats" && hasAts ? (
        <TailoredAtsPreview snapshot={structuredSnapshot} />
      ) : null}

      {mode === "match" && hasMatch ? (
        <div className="space-y-4">
          {noteItems.length > 0 ? (
            <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
              {noteItems.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : matchNotes ? (
            <p className="text-muted-foreground text-sm">{matchNotes}</p>
          ) : null}
          {matchAnalysis ? (
            <ResumeMatchChecklist analysis={matchAnalysis} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
