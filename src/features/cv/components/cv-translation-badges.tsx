"use client";

import type { FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface CvTranslationBadgesProps {
  languages: AppLanguage[];
  translations?: {
    appLanguageId: string;
    [key: string]: unknown;
  }[];
  requiredKeys: string[];
  className?: string;
}

export const CvTranslationBadges: FC<CvTranslationBadgesProps> = ({
  languages,
  translations,
  requiredKeys,
  className,
}) => {
  if (!languages.length) return null;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label="Translation completeness"
    >
      {languages.map((lang) => {
        const tr = translations?.find((t) => t.appLanguageId === lang.id);
        const hasEntry = !!tr;

        let isComplete = false;
        let isPartial = false;

        if (hasEntry) {
          if (requiredKeys.length === 0) {
            isComplete = true;
          } else {
            const filledCount = requiredKeys.filter((k) => {
              const val = tr[k];
              return typeof val === "string"
                ? val.trim().length > 0
                : Boolean(val);
            }).length;

            isComplete = filledCount === requiredKeys.length;
            isPartial = filledCount > 0 && filledCount < requiredKeys.length;
          }
        }

        const label = `${lang.name} (${lang.code.toUpperCase()}): ${
          isComplete ? "Complete" : isPartial ? "Incomplete" : "Not translated"
        }`;

        return (
          <span
            key={lang.id}
            title={label}
            aria-label={label}
            className={cn(
              "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tabular-nums transition-colors",
              isComplete &&
                "border border-emerald-500/30 bg-emerald-500/15 text-emerald-500",
              isPartial &&
                "border border-amber-500/30 bg-amber-500/15 text-amber-500",
              !hasEntry &&
                "border-border/40 bg-muted/40 text-muted-foreground/60 border",
            )}
          >
            {lang.code}
          </span>
        );
      })}
    </div>
  );
};

export default CvTranslationBadges;
