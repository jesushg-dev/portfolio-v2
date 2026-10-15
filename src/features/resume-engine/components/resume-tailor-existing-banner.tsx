"use client";

import type { FC, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

export interface ExistingCvFile {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface ResumeTailorExistingBannerProps {
  existingCvFile: ExistingCvFile;
  children?: ReactNode;
}

export const ResumeTailorExistingBanner: FC<
  ResumeTailorExistingBannerProps
> = ({ existingCvFile, children }) => {
  const t = useTranslations("admin.resumeStudio");

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <CheckCircle2
          className="text-primary mt-0.5 size-4.5 shrink-0"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-primary text-sm font-medium">
            {t("tailorAlreadyDone")}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t("tailorGeneratedOn", {
              date: new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(existingCvFile.uploadedAt)),
            })}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};
