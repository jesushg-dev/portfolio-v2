"use client";

import type { FC } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiPromptPackage } from "@/features/resume-engine/lib/ai/prompt-package";

interface ManualAiPanelProps {
  promptPackage: AiPromptPackage | null | undefined;
  isLoadingPrompt: boolean;
  onLoadPrompt: () => void;
  rawJson: string;
  onRawJsonChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  canLoadPrompt: boolean;
}

export const ManualAiPanel: FC<ManualAiPanelProps> = ({
  promptPackage,
  isLoadingPrompt,
  onLoadPrompt,
  rawJson,
  onRawJsonChange,
  onSubmit,
  isPending,
  submitLabel,
  canLoadPrompt,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = useCallback(async () => {
    if (!promptPackage?.combinedPrompt) return;
    try {
      await navigator.clipboard.writeText(promptPackage.combinedPrompt);
      setCopied(true);
      toast.success(t("aiPromptCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("aiPromptCopyFailed"));
    }
  }, [promptPackage, t]);

  const handleCopyPromptClick = useCallback(() => {
    void handleCopyPrompt();
  }, [handleCopyPrompt]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t("aiManualPromptTitle")}</Label>
        <p className="text-muted-foreground text-sm">
          {t("aiManualPromptHint")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canLoadPrompt || isLoadingPrompt}
            onClick={onLoadPrompt}
          >
            {isLoadingPrompt ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("aiLoadPrompt")}
          </Button>
          {promptPackage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPromptClick}
            >
              {copied ? (
                <Check className="mr-2 size-4" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {t("aiCopyPrompt")}
            </Button>
          ) : null}
        </div>
        {promptPackage ? (
          <Textarea
            readOnly
            value={promptPackage.combinedPrompt}
            rows={12}
            className="font-mono text-xs"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-ai-json">{t("aiManualJsonTitle")}</Label>
        <p className="text-muted-foreground text-sm">{t("aiManualJsonHint")}</p>
        <Textarea
          id="manual-ai-json"
          value={rawJson}
          onChange={(e) => onRawJsonChange(e.target.value)}
          placeholder={t("aiManualJsonPlaceholder")}
          rows={12}
          className="font-mono text-xs"
        />
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={isPending || rawJson.trim().length < 2}
        className="self-start"
      >
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
};
