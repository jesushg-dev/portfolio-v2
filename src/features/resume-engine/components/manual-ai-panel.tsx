"use client";

import type { FC, ReactNode } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiPromptPackage } from "@/features/resume-engine/lib/ai/prompt-package";
import { cn } from "@/lib/utils";

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
  variant?: "default" | "compact";
  hideSubmit?: boolean;
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
  variant = "default",
  hideSubmit = false,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

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

  const handleTogglePrompt = useCallback(() => {
    setPromptOpen((open) => !open);
  }, []);

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-3.5">
        <ManualStep
          step={1}
          title={t("manualStepCopy")}
          body={
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canLoadPrompt || isLoadingPrompt || !promptPackage}
                  onClick={handleCopyPromptClick}
                >
                  {copied ? (
                    <Check className="mr-1.5 size-3.5" />
                  ) : (
                    <Copy className="mr-1.5 size-3.5" />
                  )}
                  {t("aiCopyPrompt")}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-primary h-auto px-0 text-xs"
                  disabled={!canLoadPrompt || isLoadingPrompt}
                  onClick={() => {
                    if (!promptPackage) onLoadPrompt();
                    handleTogglePrompt();
                  }}
                >
                  {t("viewPrompt")}
                  <ChevronDown
                    className={cn(
                      "ml-0.5 size-3.5 transition-transform",
                      promptOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </Button>
              </div>
              {!promptPackage ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canLoadPrompt || isLoadingPrompt}
                  onClick={onLoadPrompt}
                >
                  {isLoadingPrompt ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : null}
                  {t("aiLoadPrompt")}
                </Button>
              ) : null}
              {promptOpen && promptPackage ? (
                <div className="bg-muted/50 text-muted-foreground rounded-md p-2.5 font-mono text-xs whitespace-pre-wrap">
                  {promptPackage.combinedPrompt}
                </div>
              ) : null}
            </div>
          }
        />

        <ManualStep
          step={2}
          title={t("manualStepPasteAi")}
          body={
            <div className="flex flex-wrap gap-1.5">
              {["ChatGPT", "Claude", "Gemini"].map((chip) => (
                <span
                  key={chip}
                  className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-[11px]"
                >
                  {chip}
                </span>
              ))}
            </div>
          }
        />

        <ManualStep
          step={3}
          title={t("manualStepPasteReply")}
          body={
            <Textarea
              value={rawJson}
              onChange={(e) => onRawJsonChange(e.target.value)}
              placeholder={t("aiManualJsonPlaceholder")}
              rows={2}
              className="text-xs"
            />
          }
        />

        {!hideSubmit ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending || rawJson.trim().length < 2}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {submitLabel}
          </Button>
        ) : null}
      </div>
    );
  }

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

      {!hideSubmit ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending || rawJson.trim().length < 2}
          className="self-start"
        >
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      ) : null}
    </div>
  );
};

function ManualStep({
  step,
  title,
  body,
}: {
  step: number;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[13px] font-medium">{title}</p>
        {body}
      </div>
    </div>
  );
}
