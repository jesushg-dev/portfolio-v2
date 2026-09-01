"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, X } from "lucide-react";

import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";

interface ResumeMatchChecklistProps {
  analysis: CvMatchAnalysis;
}

export const ResumeMatchChecklist: FC<ResumeMatchChecklistProps> = ({
  analysis,
}) => {
  const t = useTranslations("admin.resumeStudio");

  return (
    <div className="flex flex-col gap-4 text-sm">
      {analysis.keywords.length > 0 ? (
        <div>
          <p className="mb-2 font-medium">{t("matchKeywords")}</p>
          <ul className="flex flex-col gap-1.5">
            {analysis.keywords.map((keyword) => (
              <li
                key={`${keyword.term}-${keyword.status}`}
                className="flex items-start gap-2"
              >
                {keyword.status === "present" ? (
                  <Check className="text-primary mt-0.5 size-3.5 shrink-0" />
                ) : keyword.status === "paraphrased" ? (
                  <Minus className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                ) : (
                  <X className="text-destructive mt-0.5 size-3.5 shrink-0" />
                )}
                <span>
                  <span className="font-medium">{keyword.term}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {t(`matchStatus.${keyword.status}`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.mustHaves.length > 0 ? (
        <div>
          <p className="mb-1 font-medium">{t("matchMustHaves")}</p>
          <p className="text-muted-foreground">
            {analysis.mustHaves.join(" · ")}
          </p>
        </div>
      ) : null}

      {analysis.niceToHaves.length > 0 ? (
        <div>
          <p className="mb-1 font-medium">{t("matchNiceToHaves")}</p>
          <p className="text-muted-foreground">
            {analysis.niceToHaves.join(" · ")}
          </p>
        </div>
      ) : null}

      {analysis.skillGaps.length > 0 ? (
        <div>
          <p className="mb-1 font-medium">{t("matchGaps")}</p>
          <p className="text-muted-foreground">
            {analysis.skillGaps.join(" · ")}
          </p>
        </div>
      ) : null}

      {analysis.improvements.length > 0 ? (
        <div>
          <p className="mb-2 font-medium">{t("matchImprovements")}</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-4">
            {analysis.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.touchedBlocks.length > 0 ? (
        <div>
          <p className="mb-1 font-medium">{t("matchTouched")}</p>
          <p className="text-muted-foreground">
            {analysis.touchedBlocks.join(" · ")}
          </p>
        </div>
      ) : null}
    </div>
  );
};
