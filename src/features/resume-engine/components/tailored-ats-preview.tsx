"use client";

import type { FC } from "react";
import { useMemo } from "react";

import CvAtsPreview from "@/components/curriculum-vitae/cv-ats-preview";
import { mapDraftToLocalizedCv } from "@/features/cv/lib/map-draft-to-localized";
import { CvImportDraftSchema } from "@/features/cv/lib/cv-import-draft";

interface TailoredAtsPreviewProps {
  snapshot: unknown;
}

export const TailoredAtsPreview: FC<TailoredAtsPreviewProps> = ({
  snapshot,
}) => {
  const mapped = useMemo(() => {
    const parsed = CvImportDraftSchema.safeParse(snapshot);
    if (!parsed.success) return null;
    return mapDraftToLocalizedCv(parsed.data);
  }, [snapshot]);

  if (!mapped) return null;

  return (
    <div className="min-h-[min(80dvh,56rem)] overflow-auto rounded-md border bg-white">
      <CvAtsPreview data={mapped.data} aboutMeText={mapped.aboutMeText} />
    </div>
  );
};
