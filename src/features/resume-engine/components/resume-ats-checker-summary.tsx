"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ChartColumn } from "lucide-react";

import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { cn } from "@/lib/utils";

interface ResumeAtsCheckerSummaryProps {
  aiScore?: number | null;
  matchNotes?: string | null;
  matchAnalysis?: CvMatchAnalysis | null;
  className?: string;
}

export const ResumeAtsCheckerSummary: FC<ResumeAtsCheckerSummaryProps> = ({
  aiScore = null,
  matchNotes = null,
  matchAnalysis = null,
  className,
}) => {
  const t = useTranslations("admin.resumeStudio");

  const missingKeywords =
    matchAnalysis?.keywords.filter((item) => item.status === "missing") ?? [];
  const skillGaps = matchAnalysis?.skillGaps ?? [];
  const improvements = matchAnalysis?.improvements ?? [];
  const hasContent =
    aiScore != null ||
    Boolean(matchNotes?.trim()) ||
    missingKeywords.length > 0 ||
    skillGaps.length > 0 ||
    improvements.length > 0 ||
    Boolean(matchAnalysis?.mustHaves.length);

  if (!hasContent) return null;

  const scoreTone =
    aiScore == null
      ? "text-muted-foreground"
      : aiScore >= 80
        ? "text-primary"
        : aiScore >= 60
          ? "text-foreground"
          : "text-destructive";

  return (
    <div
      className={cn(
        "border-border bg-muted/30 space-y-3 rounded-lg border p-3.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ChartColumn className="text-muted-foreground size-4 shrink-0" />
        <p className="text-sm font-medium">{t("atsCheckerTitle")}</p>
        {aiScore != null ? (
          <span className={cn("ml-auto text-sm font-semibold", scoreTone)}>
            {t("atsCheckerScore", { score: Math.round(aiScore) })}
          </span>
        ) : null}
      </div>

      {matchNotes?.trim() ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {matchNotes.trim()}
        </p>
      ) : null}

      {skillGaps.length > 0 || missingKeywords.length > 0 ? (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="text-destructive size-3.5" aria-hidden />
            {t("atsCheckerGaps")}
          </p>
          <p className="text-muted-foreground text-sm">
            {[
              ...skillGaps,
              ...missingKeywords.map((item) => item.term),
            ]
              .filter((value, index, all) => all.indexOf(value) === index)
              .join(" · ")}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="text-primary size-3.5" aria-hidden />
          {t("atsCheckerNoCriticalGaps")}
        </p>
      )}

      {improvements.length > 0 ? (
        <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
          {improvements.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
