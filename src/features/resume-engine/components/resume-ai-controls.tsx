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
  layout?: "default" | "compact";
}

export const ResumeAiControls: FC<ResumeAiControlsProps> = ({
  mode,
  onModeChange,
  provider,
  onProviderChange,
  providers,
  defaultProvider,
  hasAutoProviders,
  layout = "default",
}) => {
  const t = useTranslations("admin.resumeStudio");

  const effectiveProvider =
    provider ?? defaultProvider ?? providers[0]?.id ?? "";

  const isCompact = layout === "compact";
  const optionClassName = (active: boolean, disabled = false) =>
    cn(
      "rounded-md border text-left transition-colors",
      isCompact
        ? "flex flex-col gap-0.5 p-2.5"
        : "border-input bg-background hover:bg-muted rounded-sm p-3",
      active
        ? isCompact
          ? "border-primary bg-primary/5"
          : "border-primary ring-ring ring-2"
        : isCompact
          ? "border-border bg-background hover:bg-muted/50"
          : "border-input bg-background hover:bg-muted",
      disabled && "cursor-not-allowed opacity-50",
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {isCompact ? (
          <p className="text-sm font-medium">{t("aiModeTitle")}</p>
        ) : (
          <Label>{t("aiModeLabel")}</Label>
        )}
        <div className="grid gap-2 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-2">
          <button
            type="button"
            disabled={!hasAutoProviders}
            onClick={() => onModeChange("auto")}
            className={optionClassName(mode === "auto", !hasAutoProviders)}
          >
            <p
              className={cn(
                "font-medium",
                isCompact ? "text-[13px]" : "text-sm",
                mode === "auto" && isCompact && "text-primary",
              )}
            >
              {t("aiModeAuto")}
            </p>
            <p
              className={cn(
                "text-muted-foreground leading-snug",
                isCompact ? "text-xs" : "mt-1 text-xs",
              )}
            >
              {hasAutoProviders
                ? t("aiModeAutoHint")
                : t("aiModeAutoUnavailable")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("manual")}
            className={optionClassName(mode === "manual")}
          >
            <p
              className={cn(
                "font-medium",
                isCompact ? "text-[13px]" : "text-sm",
                mode === "manual" && isCompact && "text-primary",
              )}
            >
              {t("aiModeManualShort")}
            </p>
            <p
              className={cn(
                "text-muted-foreground leading-snug",
                isCompact ? "text-xs" : "mt-1 text-xs",
              )}
            >
              {t("aiModeManualHint")}
            </p>
          </button>
        </div>
      </div>

      {mode === "auto" && hasAutoProviders ? (
        <div className="flex flex-col gap-2">
          {!isCompact ? (
            <Label htmlFor="ai-provider">{t("aiProviderLabel")}</Label>
          ) : null}
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
            <SelectTrigger
              id="ai-provider"
              className={cn("w-full", !isCompact && "max-w-sm")}
            >
              <SelectValue placeholder={t("aiProviderPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {providers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {isCompact ? item.label : `${item.label} (${item.model})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
};
