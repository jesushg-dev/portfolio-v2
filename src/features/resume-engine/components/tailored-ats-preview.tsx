"use client";

import type { FC } from "react";
import { useMemo } from "react";

import CvAtsPreview from "@/components/curriculum-vitae/cv-ats-preview";
import { mapDraftToLocalizedCv } from "@/features/cv/lib/map-draft-to-localized";
import { readResumeSnapshot } from "../lib/tailored-resume-document";

interface TailoredAtsPreviewProps {
  snapshot: unknown;
}

export const TailoredAtsPreview: FC<TailoredAtsPreviewProps> = ({
  snapshot,
}) => {
  const mapped = useMemo(() => {
    const draft = readResumeSnapshot(snapshot);
    if (!draft) return null;
    return { ...mapDraftToLocalizedCv(draft), locale: draft.detectedLocale };
  }, [snapshot]);

  if (!mapped) return null;

  return (
    <div className="min-h-[min(80dvh,56rem)] overflow-auto rounded-md border bg-white">
      <CvAtsPreview
        locale={mapped.locale}
        data={mapped.data}
        aboutMeText={mapped.aboutMeText}
      />
    </div>
  );
};
