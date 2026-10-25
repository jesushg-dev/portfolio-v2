"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface LanguageProgress {
  id: string;
  name: string;
  code: string;
  isBase?: boolean;
  hasContent: boolean;
  completedCount: number;
  totalCount: number;
}

export interface AdminFormLanguageBarProps {
  languages: LanguageProgress[];
  activeLangId: string;
  onSelectLang: (langId: string) => void;
  missingItems?: string[];
  isNonPrimary?: boolean;
  showOriginal?: boolean;
  onToggleShowOriginal?: (show: boolean) => void;
  baseLabel?: string;
  completeProgressText?: (completed: number, total: number) => string;
  notTranslatedText?: (languageName: string) => string;
  allCompleteText?: string;
  missingFieldsText?: (fields: string) => string;
  showOriginalText?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// AdminFormLanguageBar Component
// ---------------------------------------------------------------------------

export function AdminFormLanguageBar({
  languages,
  activeLangId,
  onSelectLang,
  missingItems = [],
  isNonPrimary = false,
  showOriginal = true,
  onToggleShowOriginal,
  baseLabel = "Base",
  completeProgressText = (completed, total) => `${completed}/${total} complete`,
  notTranslatedText = (name) => `Not translated in ${name}`,
  allCompleteText = "All complete ✓",
  missingFieldsText = (fields) => `Missing: ${fields}`,
  showOriginalText = "Show original",
  className,
}: AdminFormLanguageBarProps) {
  if (languages.length === 0) return null;

  return (
    <div
      className={cn(
        "border-border bg-card/90 sticky top-0 z-10 -mx-1 -mt-2 rounded-xl border p-3 backdrop-blur",
        className,
      )}
    >
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Language selector"
      >
        {languages.map((lang) => {
          const isSelected = lang.id === activeLangId;
          const ok = lang.completedCount;
          const total = lang.totalCount;

          return (
            <button
              key={lang.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectLang(lang.id)}
              className={cn(
                "border-border bg-card hover:border-primary/50 focus-visible:ring-primary relative flex min-w-36 shrink-0 flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all outline-none focus-visible:ring-2",
                isSelected && "border-primary/60 bg-primary/10 shadow-sm",
                !lang.hasContent && "border-dashed opacity-80",
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-foreground">{lang.name}</span>
                {lang.isBase && (
                  <span className="bg-primary/20 text-primary rounded px-1.5 py-0.5 text-[0.625rem] font-bold">
                    {baseLabel}
                  </span>
                )}
              </div>

              {lang.hasContent && total > 0 ? (
                <>
                  <span className="bg-muted h-1 w-full overflow-hidden rounded-full">
                    <i
                      className={cn(
                        "block h-full rounded-full transition-all",
                        ok === total ? "bg-emerald-500" : "bg-primary",
                      )}
                      style={{
                        width: `${Math.round((ok / total) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="text-muted-foreground text-[0.625rem] tabular-nums">
                    {completeProgressText(ok, total)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-[0.625rem]">
                  {notTranslatedText(lang.name)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-border/60 mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
        <span className="text-muted-foreground">
          {missingItems.length > 0
            ? missingFieldsText(missingItems.slice(0, 3).join(", "))
            : allCompleteText}
        </span>
        {isNonPrimary && onToggleShowOriginal && (
          <label className="text-muted-foreground flex cursor-pointer items-center gap-2">
            <Switch
              checked={showOriginal}
              onCheckedChange={onToggleShowOriginal}
              className="scale-75"
            />
            <span>{showOriginalText}</span>
          </label>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReferenceSnippet Component
// ---------------------------------------------------------------------------

export interface ReferenceSnippetProps {
  label: string;
  content: string;
  onCopy: () => void;
  copyText?: string;
  className?: string;
}

export function ReferenceSnippet({
  label,
  content,
  onCopy,
  copyText = "Copy",
  className,
}: ReferenceSnippetProps) {
  if (!content) return null;

  return (
    <div
      className={cn(
        "border-border/60 bg-muted/30 mb-1.5 flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
        className,
      )}
    >
      <span className="text-muted-foreground min-w-0 flex-1 break-words">
        <span className="bg-muted text-foreground mr-1.5 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold">
          {label}
        </span>
        {content.length > 180 ? `${content.slice(0, 180)}…` : content}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="text-primary shrink-0 text-xs font-medium hover:underline"
      >
        {copyText}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminFormEmptyTranslation Component
// ---------------------------------------------------------------------------

export interface AdminFormEmptyTranslationProps {
  languageName: string;
  baseLanguageName: string;
  onCopyFromBase?: () => void;
  onStartBlank: () => void;
  notTranslatedTitle?: string;
  notTranslatedText?: string;
  notTranslatedHint?: string;
  notTranslatedHintText?: string;
  copyFromBaseText?: string;
  startBlankText?: string;
  className?: string;
}

export function AdminFormEmptyTranslation({
  languageName,
  baseLanguageName,
  onCopyFromBase,
  onStartBlank,
  notTranslatedTitle,
  notTranslatedText,
  notTranslatedHint,
  notTranslatedHintText,
  copyFromBaseText,
  startBlankText = "Start blank",
  className,
}: AdminFormEmptyTranslationProps) {
  const title =
    notTranslatedTitle ??
    notTranslatedText ??
    `Not translated in ${languageName}`;
  const hint =
    notTranslatedHint ??
    notTranslatedHintText ??
    `Saved as an independent translation. Start blank or copy from ${baseLanguageName}.`;

  return (
    <div
      className={cn(
        "border-border/80 rounded-2xl border border-dashed p-8 text-center",
        className,
      )}
    >
      <h4 className="text-foreground font-medium">{title}</h4>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
        {hint}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onCopyFromBase && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onCopyFromBase}
          >
            {copyFromBaseText ?? `Copy from ${baseLanguageName}`}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onStartBlank}
        >
          {startBlankText}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminFormDeleteTranslation Component
// ---------------------------------------------------------------------------

export interface AdminFormDeleteTranslationProps {
  languageName: string;
  onDelete: () => void;
  buttonText?: string;
  deleteTranslationText?: string;
  confirmQuestion?: string;
  deleteConfirmText?: string;
  confirmDeleteText?: string;
  cancelText?: string;
  className?: string;
}

export function AdminFormDeleteTranslation({
  languageName,
  onDelete,
  buttonText,
  deleteTranslationText,
  confirmQuestion,
  deleteConfirmText,
  confirmDeleteText = "Delete",
  cancelText = "Cancel",
  className,
}: AdminFormDeleteTranslationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = () => {
    onDelete();
    setIsConfirming(false);
  };

  const effectiveButtonText =
    buttonText ??
    deleteTranslationText ??
    `Delete translation in ${languageName}`;
  const effectiveConfirmQuestion =
    confirmQuestion ??
    deleteConfirmText ??
    `Delete translation in ${languageName}?`;

  return (
    <div className={cn("border-border/80 mt-8 border-t pt-4", className)}>
      {isConfirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-destructive text-xs font-medium">
            {effectiveConfirmQuestion}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-8 text-xs"
            >
              {confirmDeleteText}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirming(false)}
              className="h-8 text-xs"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsConfirming(true)}
          className="text-muted-foreground hover:text-destructive text-xs"
        >
          <Trash2 className="mr-1.5 size-3.5" />
          <span>{effectiveButtonText}</span>
        </Button>
      )}
    </div>
  );
}
