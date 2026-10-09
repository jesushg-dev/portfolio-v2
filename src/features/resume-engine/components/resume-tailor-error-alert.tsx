"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AiProcessingMode } from "@/features/resume-engine/components/resume-ai-controls";

export interface ResumeTailorErrorAlertProps {
  error: string | null;
  isPending?: boolean;
  effectiveMode: AiProcessingMode;
  hasAutoProviders: boolean;
  onRetry: () => void;
  onClearError: () => void;
  onSwitchToManual: () => void;
}

export const ResumeTailorErrorAlert: FC<ResumeTailorErrorAlertProps> = ({
  error,
  isPending = false,
  effectiveMode,
  hasAutoProviders,
  onRetry,
  onClearError,
  onSwitchToManual,
}) => {
  const t = useTranslations("admin.resumeStudio");

  if (!error) return null;

  return (
    <div
      className="border-destructive/30 bg-destructive/5 mt-4 rounded-lg border p-3.5"
      role="alert"
    >
      <div className="flex gap-2">
        <AlertTriangle
          className="text-destructive mt-0.5 size-4.5 shrink-0"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-destructive text-xs font-medium sm:text-sm">
            {t("tailorFailed")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {error}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onRetry}
            >
              <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
              {t("tailorErrorRetry")}
            </Button>
            {effectiveMode === "auto" && hasAutoProviders ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearError}
              >
                {t("tailorErrorSwitchProvider")}
              </Button>
            ) : null}
            {hasAutoProviders ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwitchToManual}
              >
                {t("tailorErrorUseManual")}
              </Button>
            ) : null}
          </div>
          <details className="mt-2">
            <summary className="text-muted-foreground cursor-pointer text-[0.6875rem]">
              {t("tailorTechnicalDetails")}
            </summary>
            <p className="text-muted-foreground mt-1.5 font-mono text-[0.6875rem] break-all">
              {error}
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};
