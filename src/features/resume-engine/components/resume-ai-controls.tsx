"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { Bot, FileCode } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ResumeOptionCard } from "./resume-option-card";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {isCompact ? (
          <p className="text-sm font-medium">{t("aiModeTitle")}</p>
        ) : (
          <Label>{t("aiModeLabel")}</Label>
        )}
        <div
          role="radiogroup"
          aria-label={isCompact ? t("aiModeTitle") : t("aiModeLabel")}
          className="grid grid-cols-2 gap-3"
        >
          <ResumeOptionCard
            selected={mode === "auto"}
            disabled={!hasAutoProviders}
            onSelect={() => onModeChange("auto")}
            title={t("aiModeAuto")}
            subtitle={
              hasAutoProviders
                ? t("aiModeAutoHint")
                : t("aiModeAutoUnavailable")
            }
            icon={
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="size-3.5" />
              </div>
            }
            iconWellClassName="size-9 rounded-md bg-muted/30 p-0"
          />
          <ResumeOptionCard
            selected={mode === "manual"}
            onSelect={() => onModeChange("manual")}
            title={t("aiModeManualShort")}
            subtitle={t("aiModeManualHint")}
            icon={
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileCode className="size-3.5" />
              </div>
            }
            iconWellClassName="size-9 rounded-md bg-muted/30 p-0"
          />
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
