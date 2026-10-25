"use client";

import type { FC } from "react";
import { Copy } from "lucide-react";
import { hasText } from "../lib/profile-unified-types";

interface ProfileReferenceBoxProps {
  baseLanguageCode: string;
  referenceText: string;
  onCopy: () => void;
  copyLabel: string;
}

export const ProfileReferenceBox: FC<ProfileReferenceBoxProps> = ({
  baseLanguageCode,
  referenceText,
  onCopy,
  copyLabel,
}) => {
  if (!hasText(referenceText)) return null;

  const displaySnippet =
    referenceText.length > 160
      ? referenceText.slice(0, 160) + "…"
      : referenceText;

  return (
    <div className="border-border/70 bg-muted/40 mb-1.5 flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground">
      <span className="min-w-0 flex-1 break-words">
        <span className="bg-muted text-foreground/80 mr-1.5 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase">
          {baseLanguageCode}
        </span>
        <span>{displaySnippet}</span>
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="text-primary hover:text-primary/80 hover:underline inline-flex shrink-0 items-center gap-1 font-medium cursor-pointer"
        aria-label={`${copyLabel} (${baseLanguageCode})`}
      >
        <Copy className="size-3" aria-hidden />
        <span>{copyLabel}</span>
      </button>
    </div>
  );
};
