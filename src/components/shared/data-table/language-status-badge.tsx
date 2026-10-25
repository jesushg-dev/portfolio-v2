"use client";

import { cn } from "@/lib/utils";

export type LanguageTranslationStatus = "complete" | "incomplete" | "missing";

export interface LanguageStatusItem {
  code: string;
  name?: string;
  status: LanguageTranslationStatus;
}

export interface LanguageStatusBadgeProps {
  languages: LanguageStatusItem[];
  className?: string;
}

const statusStyles: Record<LanguageTranslationStatus, string> = {
  complete: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  incomplete: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  missing: "bg-muted text-muted-foreground/50 border-border/40",
};

const statusLabels: Record<LanguageTranslationStatus, string> = {
  complete: "Complete",
  incomplete: "Incomplete",
  missing: "Missing",
};

export function LanguageStatusBadge({
  languages,
  className,
}: LanguageStatusBadgeProps) {
  if (!languages || languages.length === 0) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label="Translation statuses"
    >
      {languages.map(({ code, name, status }) => {
        const titleText = `${name ?? code.toUpperCase()} · ${statusLabels[status]}`;
        return (
          <span
            key={code}
            title={titleText}
            aria-label={titleText}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wider uppercase tabular-nums transition-colors",
              statusStyles[status],
            )}
          >
            {code}
          </span>
        );
      })}
    </span>
  );
}

export function computeTranslationStatus(
  translation: object | null | undefined,
  requiredFields: string[],
): LanguageTranslationStatus {
  if (!translation) return "missing";
  const record = translation as Record<string, unknown>;
  const filledCount = requiredFields.filter((key) => {
    const val = record[key];
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return val != null;
  }).length;

  if (filledCount === requiredFields.length) return "complete";
  if (filledCount > 0) return "incomplete";
  return "missing";
}
