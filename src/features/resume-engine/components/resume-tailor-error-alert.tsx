"use client";

import type { FC } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AiProcessingMode } from "@/features/resume-engine/components/resume-ai-controls";
import type { AiPromptPackage } from "@/features/resume-engine/lib/ai/prompt-package";
import type { TechnologyEquivalence } from "@/features/resume-engine/lib/extract-job-tools";
import type { ResumeTailorFieldIssue } from "@/features/resume-engine/lib/resume-tailor-validation-error";

export interface ResumeTailorFailure {
  message: string;
  validation?: ResumeTailorFieldIssue[] | null;
}

export interface ResumeTailorErrorAlertProps {
  error: ResumeTailorFailure | null;
  isPending?: boolean;
  isGeneratingCorrection?: boolean;
  effectiveMode: AiProcessingMode;
  hasAutoProviders: boolean;
  correctionPrompt?: AiPromptPackage | null;
  onRetry: () => void;
  onClearError: () => void;
  onSwitchToManual: () => void;
  onConfirmEquivalence?: (pair: TechnologyEquivalence) => void;
  onRejectEquivalence?: (pair: TechnologyEquivalence) => void;
  onCreateCorrectionPrompt?: () => void;
}

type ResumeStudioTranslate = ReturnType<
  typeof useTranslations<"admin.resumeStudio">
>;

export const ResumeTailorErrorAlert: FC<ResumeTailorErrorAlertProps> = ({
  error,
  isPending = false,
  isGeneratingCorrection = false,
  effectiveMode,
  hasAutoProviders,
  correctionPrompt = null,
  onRetry,
  onClearError,
  onSwitchToManual,
  onConfirmEquivalence,
  onRejectEquivalence,
  onCreateCorrectionPrompt,
}) => {
  const t = useTranslations("admin.resumeStudio");

  if (!error) return null;
  const issuesByField = new Map<string, ResumeTailorFieldIssue[]>();
  for (const issue of error.validation ?? []) {
    const issues = issuesByField.get(issue.fieldId);
    if (issues) issues.push(issue);
    else issuesByField.set(issue.fieldId, [issue]);
  }
  const hasValidation = issuesByField.size > 0;

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
          <p className="text-destructive text-sm font-medium">
            {t("tailorFailed")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {hasValidation ? t("tailorValidation.intro") : error.message}
          </p>
          {hasValidation ? (
            <ul className="mt-3 space-y-2">
              {[...issuesByField].map(([fieldId, issues]) => (
                <TailorFieldComparison
                  key={fieldId}
                  t={t}
                  issues={issues}
                  effectiveMode={effectiveMode}
                  isPending={isPending}
                  isGeneratingCorrection={isGeneratingCorrection}
                  onConfirmEquivalence={onConfirmEquivalence}
                  onRejectEquivalence={onRejectEquivalence}
                />
              ))}
            </ul>
          ) : null}
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
            {hasValidation &&
            effectiveMode === "manual" &&
            onCreateCorrectionPrompt ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || isGeneratingCorrection}
                onClick={onCreateCorrectionPrompt}
              >
                <Sparkles className="mr-1.5 size-3.5" aria-hidden />
                {t("tailorErrorCorrectionPrompt")}
              </Button>
            ) : null}
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
          {correctionPrompt ? (
            <CorrectionPromptPanel t={t} prompt={correctionPrompt} />
          ) : null}
          {hasValidation ? (
            <details className="mt-2">
              <summary className="text-muted-foreground cursor-pointer text-sm">
                {t("tailorTechnicalDetails")}
              </summary>
              <p className="text-muted-foreground mt-1.5 font-mono text-sm wrap-anywhere whitespace-pre-wrap">
                {error.message}
              </p>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
};

function TailorFieldComparison({
  t,
  issues,
  effectiveMode,
  isPending,
  isGeneratingCorrection,
  onConfirmEquivalence,
  onRejectEquivalence,
}: {
  t: ResumeStudioTranslate;
  issues: ResumeTailorFieldIssue[];
  effectiveMode: AiProcessingMode;
  isPending: boolean;
  isGeneratingCorrection: boolean;
  onConfirmEquivalence?: (pair: TechnologyEquivalence) => void;
  onRejectEquivalence?: (pair: TechnologyEquivalence) => void;
}) {
  const [issue] = issues;
  if (!issue) return null;

  const field =
    issue.field === "bullet" && issue.bullet !== undefined
      ? t("tailorValidation.bulletNumber", { number: issue.bullet })
      : t(`tailorValidation.fields.${issue.field}`);
  const facts = issues.find(({ numericFacts }) => numericFacts)?.numericFacts;
  const canResolveEquivalence =
    issues.some((entry) => entry.reason === "technologyIdentity") &&
    Boolean(issue.original) &&
    Boolean(issue.proposed) &&
    Boolean(onConfirmEquivalence ?? onRejectEquivalence);

  return (
    <li className="bg-background border-border rounded-md border p-3 text-sm wrap-break-word">
      <p className="text-foreground font-semibold">
        {issue.context ? `${issue.context} · ` : ""}
        {field}
      </p>
      <ul className="text-muted-foreground mt-1 space-y-1">
        {issues.map((entry) => (
          <li key={entry.reason}>
            {t(`tailorValidation.reasons.${entry.reason}`, {
              limit: entry.limit ?? 0,
              locale: entry.locale ?? "",
              tokens: entry.tokens?.join(", ") ?? "",
            })}
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="bg-muted/50 min-w-0 rounded-md p-2.5">
          <dt className="text-muted-foreground font-medium">
            {t("tailorValidation.original")}
          </dt>
          <dd className="text-foreground mt-1 whitespace-pre-wrap">
            {issue.field === "technologyName" && !issue.original
              ? t("tailorValidation.unknownTechnology")
              : issue.original}
          </dd>
          {facts ? (
            <dd className="text-muted-foreground mt-2">
              {t("tailorValidation.detected", {
                values: facts.original.join(", ") || t("tailorValidation.none"),
              })}
            </dd>
          ) : null}
        </div>
        <div className="bg-destructive/5 min-w-0 rounded-md p-2.5">
          <dt className="text-muted-foreground font-medium">
            {t("tailorValidation.proposed")}
          </dt>
          <dd className="text-foreground mt-1 whitespace-pre-wrap">
            {issue.proposed || t("tailorValidation.noProposal")}
          </dd>
          {facts ? (
            <dd className="text-muted-foreground mt-2">
              {t("tailorValidation.detected", {
                values: facts.proposed.join(", ") || t("tailorValidation.none"),
              })}
            </dd>
          ) : null}
        </div>
      </dl>
      {canResolveEquivalence ? (
        <div className="border-border bg-muted/30 mt-3 rounded-md border p-3">
          <p className="text-foreground text-sm font-medium">
            {t("tailorValidation.equivalenceQuestion", {
              original: issue.original,
              proposed: issue.proposed,
            })}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("tailorValidation.equivalenceHint")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {onConfirmEquivalence ? (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  onConfirmEquivalence({
                    original: issue.original,
                    proposed: issue.proposed,
                  })
                }
              >
                {t("tailorValidation.confirmEquivalence")}
              </Button>
            ) : null}
            {onRejectEquivalence ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || isGeneratingCorrection}
                onClick={() =>
                  onRejectEquivalence({
                    original: issue.original,
                    proposed: issue.proposed,
                  })
                }
              >
                {t(
                  effectiveMode === "manual"
                    ? "tailorValidation.rejectEquivalenceManual"
                    : "tailorValidation.rejectEquivalenceAuto",
                )}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function CorrectionPromptPanel({
  t,
  prompt,
}: {
  t: ResumeStudioTranslate;
  prompt: AiPromptPackage;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(prompt.combinedPrompt);
        setCopied(true);
        toast.success(t("tailorValidation.copiedCorrectionPrompt"));
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error(t("aiPromptCopyFailed"));
      }
    })();
  }, [prompt.combinedPrompt, t]);

  return (
    <div className="bg-card text-card-foreground border-border mt-3 rounded-md border p-3">
      <p className="text-foreground text-sm font-semibold">
        {t("tailorValidation.correctionPromptTitle")}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("tailorValidation.correctionPromptHint")}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1.5 size-3.5" aria-hidden />
          ) : (
            <Copy className="mr-1.5 size-3.5" aria-hidden />
          )}
          {copied
            ? t("tailorValidation.copiedCorrectionPrompt")
            : t("tailorValidation.copyCorrectionPrompt")}
        </Button>
      </div>
      <details className="mt-2">
        <summary className="text-muted-foreground cursor-pointer text-sm">
          {t("tailorValidation.viewCorrectionPrompt")}
        </summary>
        <pre className="bg-muted/50 text-foreground mt-1.5 max-h-72 overflow-y-auto rounded-md p-2.5 font-mono text-sm whitespace-pre-wrap">
          {prompt.combinedPrompt}
        </pre>
      </details>
    </div>
  );
}
