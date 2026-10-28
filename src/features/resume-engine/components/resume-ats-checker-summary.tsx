"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { ChartColumn } from "lucide-react";

import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResumeAtsCheckerSummaryProps {
  aiScore?: number | null;
  expanded?: boolean;
  matchAnalysis?: CvMatchAnalysis | null;
  className?: string;
  onImprove?: () => void;
}

export const ResumeAtsCheckerSummary: FC<ResumeAtsCheckerSummaryProps> = ({
  aiScore = null,
  expanded = false,
  matchAnalysis = null,
  className,
  onImprove,
}) => {
  const t = useTranslations();

  const missingKeywords =
    matchAnalysis?.keywords.filter((item) => item.status === "missing") ?? [];
  const skillGaps = matchAnalysis?.skillGaps ?? [];
  const improvements = matchAnalysis?.improvements ?? [];
  const hasContent =
    aiScore != null ||
    Boolean(matchAnalysis?.scoreBreakdown) ||
    missingKeywords.length > 0 ||
    skillGaps.length > 0 ||
    improvements.length > 0 ||
    Boolean(matchAnalysis?.mustHaves.length);

  if (!hasContent) return null;

  const scoreTone = getScoreTone(aiScore);

  return (
    <details
      open={expanded || undefined}
      className={cn(
        "border-border bg-muted/30 space-y-3 rounded-lg border p-3.5",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 [&::-webkit-details-marker]:hidden">
        <ChartColumn className="text-muted-foreground size-4 shrink-0" />
        <p className="text-sm font-medium">
          {t("admin.resumeStudio.atsCheckerTitle")}
        </p>
        {aiScore != null ? (
          <div
            className="relative order-first size-11 shrink-0"
            role="img"
            aria-label={t("admin.resumeStudio.atsCheckerScore", {
              score: Math.round(aiScore),
            })}
          >
            <svg
              viewBox="0 0 36 36"
              className="size-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-border"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${Math.max(0, Math.min(100, aiScore))} 100`}
                className={scoreTone}
              />
            </svg>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-xs font-semibold",
                scoreTone,
              )}
            >
              {Math.round(aiScore)}%
            </span>
          </div>
        ) : null}
        {matchAnalysis?.keywords
          .filter((item) => item.status !== "present")
          .slice(0, 3)
          .map((item) => (
            <span
              key={item.term}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                item.status === "missing"
                  ? "border-destructive/40 text-destructive"
                  : "border-warning/40 text-warning",
              )}
            >
              {item.term} ·{" "}
              {t(
                item.status === "missing"
                  ? "admin.jobTracker.detail.legend.missing"
                  : "admin.jobTracker.detail.legend.partial",
              )}
            </span>
          ))}
        <span className="text-muted-foreground ml-auto text-xs">
          {t("admin.jobTracker.detail.review")}
        </span>
      </summary>

      <div className="border-border grid gap-5 border-t pt-4 xl:grid-cols-2">
        <div className="space-y-4">
          {matchAnalysis?.scoreBreakdown ? (
            (
              [
                "technologies",
                "experience",
                "operations",
                "collaboration",
                "prerequisites",
              ] as const
            ).map((key) => {
              const dimension = matchAnalysis.scoreBreakdown![key];
              const label = t(`admin.jobTracker.atsBreakdown.${key}`);
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-medium">
                    <span>{label}</span>
                    <span>{dimension.score}/20</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={20}
                    aria-valuenow={dimension.score}
                    className="bg-muted h-2 overflow-hidden rounded-full"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full bg-current",
                        getScoreTone(dimension.score * 5),
                      )}
                      style={{ width: `${dimension.score * 5}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    {dimension.evidence}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("admin.jobTracker.atsBreakdown.regenerate")}
            </p>
          )}
        </div>
        <div className="space-y-4">
          {Boolean(matchAnalysis?.strengths?.length) ? (
            <div>
              <h3 className="text-success text-sm font-semibold">
                {t("admin.jobTracker.atsBreakdown.strengths")}
              </h3>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-sm">
                {matchAnalysis?.strengths?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {improvements.length > 0 ? (
            <div>
              <h3 className="text-warning text-sm font-semibold">
                {t("admin.jobTracker.atsBreakdown.improvements")}
              </h3>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-sm">
                {improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {onImprove ? (
        <Button type="button" size="sm" variant="outline" onClick={onImprove}>
          {t("admin.jobTracker.atsCheckerImprove")}
        </Button>
      ) : null}
    </details>
  );
};

function getScoreTone(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-success";
  if (score >= 70) return "text-positive";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}
