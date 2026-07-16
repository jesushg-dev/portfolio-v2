"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AiProcessingMode = "auto" | "manual";

import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

interface AiProviderOption {
  id: AiProviderName;
  label: string;
  model: string;
}

interface ResumeAiControlsProps {
  mode: AiProcessingMode;
  onModeChange: (mode: AiProcessingMode) => void;
  provider: AiProviderName | null;
  onProviderChange: (provider: AiProviderName) => void;
  providers: AiProviderOption[];
  defaultProvider: AiProviderName | null;
  hasAutoProviders: boolean;
}

export const ResumeAiControls: FC<ResumeAiControlsProps> = ({
  mode,
  onModeChange,
  provider,
  onProviderChange,
  providers,
  defaultProvider,
  hasAutoProviders,
}) => {
  const t = useTranslations("admin.resumeStudio");

  const effectiveProvider =
    provider ?? defaultProvider ?? providers[0]?.id ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t("aiModeLabel")}</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={!hasAutoProviders}
            onClick={() => onModeChange("auto")}
            className={cn(
              "border-input bg-background hover:bg-muted rounded-sm border p-3 text-left transition-colors",
              mode === "auto" && "border-primary ring-ring ring-2",
              !hasAutoProviders && "cursor-not-allowed opacity-50",
            )}
          >
            <p className="text-sm font-medium">{t("aiModeAuto")}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {hasAutoProviders
                ? t("aiModeAutoHint")
                : t("aiModeAutoUnavailable")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("manual")}
            className={cn(
              "border-input bg-background hover:bg-muted rounded-sm border p-3 text-left transition-colors",
              mode === "manual" && "border-primary ring-ring ring-2",
            )}
          >
            <p className="text-sm font-medium">{t("aiModeManual")}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("aiModeManualHint")}
            </p>
          </button>
        </div>
      </div>

      {mode === "auto" && hasAutoProviders ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-provider">{t("aiProviderLabel")}</Label>
          <Select
            value={effectiveProvider}
            onValueChange={(value) => {
              if (
                value === "claude" ||
                value === "openai" ||
                value === "deepseek" ||
                value === "gemini"
              ) {
                onProviderChange(value);
              }
            }}
          >
            <SelectTrigger id="ai-provider" className="w-full max-w-sm">
              <SelectValue placeholder={t("aiProviderPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {providers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label} ({item.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
};
