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

export interface EquivalenceResolutionBatch {
  approved: TechnologyEquivalence[];
  rejected: TechnologyEquivalence[];
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
  onResolveEquivalences?: (batch: EquivalenceResolutionBatch) => void;
  onCreateCorrectionPrompt?: () => void;
}

type ResumeStudioTranslate = ReturnType<
  typeof useTranslations<"admin.resumeStudio">
>;

interface IdentityCandidate {
  fieldId: string;
  pair: TechnologyEquivalence;
}

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
  onResolveEquivalences,
  onCreateCorrectionPrompt,
}) => {
  const t = useTranslations("admin.resumeStudio");
  const [trackedError, setTrackedError] = useState(error);
  const [decisions, setDecisions] = useState<Record<string, "yes" | "no">>({});

  if (trackedError !== error) {
    setTrackedError(error);
    setDecisions({});
  }

  if (!error) return null;
  const issuesByField = new Map<string, ResumeTailorFieldIssue[]>();
  for (const issue of error.validation ?? []) {
    const issues = issuesByField.get(issue.fieldId);
    if (issues) issues.push(issue);
    else issuesByField.set(issue.fieldId, [issue]);
  }
  const hasValidation = issuesByField.size > 0;
  const identityCandidates: IdentityCandidate[] = [];
  for (const [fieldId, issues] of issuesByField) {
    const [first] = issues;
    if (
      first &&
      issues.some((entry) => entry.reason === "technologyIdentity") &&
      first.original &&
      first.proposed
    ) {
      identityCandidates.push({
        fieldId,
        pair: { original: first.original, proposed: first.proposed },
      });
    }
  }
  const hasIdentityChoices =
    identityCandidates.length > 0 && Boolean(onResolveEquivalences);
  const hasNoDecision = identityCandidates.some(
    ({ fieldId }) => decisions[fieldId] === "no",
  );
  const allMarkedYes =
    identityCandidates.length > 0 &&
    identityCandidates.every(({ fieldId }) => decisions[fieldId] === "yes");

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
                  decision={decisions[fieldId]}
                  showEquivalenceToggle={hasIdentityChoices}
                  onDecisionChange={(next) =>
                    setDecisions((prev) => ({ ...prev, [fieldId]: next }))
                  }
                />
              ))}
            </ul>
          ) : null}
          {hasIdentityChoices && onResolveEquivalences ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isPending || isGeneratingCorrection}
                onClick={() =>
                  onResolveEquivalences({
                    approved: identityCandidates.map(({ pair }) => pair),
                    rejected: [],
                  })
                }
              >
                {t(
                  allMarkedYes
                    ? "tailorValidation.applyAndContinue"
                    : "tailorValidation.allEquivalentContinue",
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || isGeneratingCorrection}
                onClick={() => {
                  const approved: TechnologyEquivalence[] = [];
                  const rejected: TechnologyEquivalence[] = [];
                  for (const { fieldId, pair } of identityCandidates) {
                    if (decisions[fieldId] === "yes") approved.push(pair);
                    else rejected.push(pair);
                  }
                  onResolveEquivalences({
                    approved,
                    rejected:
                      hasNoDecision || approved.length > 0
                        ? rejected
                        : identityCandidates.map(({ pair }) => pair),
                  });
                }}
              >
                {t(
                  effectiveMode === "manual"
                    ? "tailorValidation.fixMismatchesManual"
                    : "tailorValidation.fixMismatchesAuto",
                )}
              </Button>
            </div>
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
            !hasIdentityChoices &&
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
  decision,
  showEquivalenceToggle,
  onDecisionChange,
}: {
  t: ResumeStudioTranslate;
  issues: ResumeTailorFieldIssue[];
  decision?: "yes" | "no";
  showEquivalenceToggle: boolean;
  onDecisionChange: (next: "yes" | "no") => void;
}) {
  const [issue] = issues;
  if (!issue) return null;

  const field =
    issue.field === "bullet" && issue.bullet !== undefined
      ? t("tailorValidation.bulletNumber", { number: issue.bullet })
      : t(`tailorValidation.fields.${issue.field}`);
  const facts = issues.find(({ numericFacts }) => numericFacts)?.numericFacts;
  const canResolveEquivalence =
    showEquivalenceToggle &&
    issues.some((entry) => entry.reason === "technologyIdentity") &&
    Boolean(issue.original) &&
    Boolean(issue.proposed);

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
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">
            {t("tailorValidation.sameTechnologyShort")}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={decision === "yes" ? "default" : "outline"}
              aria-pressed={decision === "yes"}
              onClick={() => onDecisionChange("yes")}
            >
              {t("tailorValidation.answerYes")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={decision === "no" ? "destructive" : "outline"}
              aria-pressed={decision === "no"}
              onClick={() => onDecisionChange("no")}
            >
              {t("tailorValidation.answerNo")}
            </Button>
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
