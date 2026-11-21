"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AiProcessingMode } from "@/features/resume-engine/components/resume-ai-controls";
import type { ResumeTailorFieldIssue } from "@/features/resume-engine/lib/resume-tailor-validation-error";

export interface ResumeTailorFailure {
  message: string;
  validation?: ResumeTailorFieldIssue[] | null;
}

export interface ResumeTailorErrorAlertProps {
  error: ResumeTailorFailure | null;
  isPending?: boolean;
  effectiveMode: AiProcessingMode;
  hasAutoProviders: boolean;
  onRetry: () => void;
  onClearError: () => void;
  onSwitchToManual: () => void;
}

function TailorFieldComparison({
  issues,
}: {
  issues: ResumeTailorFieldIssue[];
}) {
  const t = useTranslations("admin.resumeStudio.tailorValidation");
  const [issue] = issues;
  if (!issue) return null;

  const field =
    issue.field === "bullet" && issue.bullet !== undefined
      ? t("bulletNumber", { number: issue.bullet })
      : t(`fields.${issue.field}`);
  const facts = issues.find(({ numericFacts }) => numericFacts)?.numericFacts;

  return (
    <li className="bg-background border-border rounded-md border p-3 text-sm wrap-break-word">
      <p className="text-foreground font-semibold">
        {issue.context ? `${issue.context} · ` : ""}
        {field}
      </p>
      <ul className="text-muted-foreground mt-1 space-y-1">
        {issues.map((entry) => (
          <li key={entry.reason}>
            {t(`reasons.${entry.reason}`, {
              limit: entry.limit ?? 0,
              locale: entry.locale ?? "",
              tokens: entry.tokens?.join(", ") ?? "",
            })}
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="bg-muted/50 min-w-0 rounded-md p-2.5">
          <dt className="text-muted-foreground font-medium">{t("original")}</dt>
          <dd className="text-foreground mt-1 whitespace-pre-wrap">
            {issue.field === "technologyName" && !issue.original
              ? t("unknownTechnology")
              : issue.original}
          </dd>
          {facts ? (
            <dd className="text-muted-foreground mt-2">
              {t("detected", {
                values: facts.original.join(", ") || t("none"),
              })}
            </dd>
          ) : null}
        </div>
        <div className="bg-destructive/5 min-w-0 rounded-md p-2.5">
          <dt className="text-muted-foreground font-medium">{t("proposed")}</dt>
          <dd className="text-foreground mt-1 whitespace-pre-wrap">
            {issue.proposed || t("noProposal")}
          </dd>
          {facts ? (
            <dd className="text-muted-foreground mt-2">
              {t("detected", {
                values: facts.proposed.join(", ") || t("none"),
              })}
            </dd>
          ) : null}
        </div>
      </dl>
    </li>
  );
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
          <p className="text-destructive text-xs font-medium sm:text-sm">
            {t("tailorFailed")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {hasValidation ? t("tailorValidation.intro") : error.message}
          </p>
          {hasValidation ? (
            <ul className="mt-3 space-y-2">
              {[...issuesByField].map(([fieldId, issues]) => (
                <TailorFieldComparison key={fieldId} issues={issues} />
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
