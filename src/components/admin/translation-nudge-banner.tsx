"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  NudgePendingLocale,
  TranslationNudgeState,
} from "@/hooks/admin/use-translation-nudge";
import { Textarea } from "@/components/ui/textarea";

interface TranslationNudgeBannerProps {
  nudge: TranslationNudgeState;
  onSaveLocale: (locale: string, value: string) => Promise<void> | void;
  onApplyAll: (value: string) => Promise<void> | void;
  onDismiss: () => void;
}

type NudgeTranslator = ReturnType<typeof useTranslations<"admin.nudge">>;

export function TranslationNudgeBanner({
  nudge,
  onSaveLocale,
  onApplyAll,
  onDismiss,
}: TranslationNudgeBannerProps) {
  const t = useTranslations("admin.nudge");
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  const pendingCount = nudge.pendingLocales.filter(
    (p) => p.status === "pending",
  ).length;

  const handleApplyAll = async () => {
    setIsApplyingAll(true);
    try {
      await onApplyAll(nudge.editedValue);
    } finally {
      setIsApplyingAll(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-900">
            {t("title", { field: nudge.fieldLabel })}
          </p>
          <p className="text-xs text-blue-600">{t("question")}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
          aria-label={t("dismissAria")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {nudge.pendingLocales.map((item) => (
          <LocaleRow
            key={item.locale}
            item={item}
            editedValue={nudge.editedValue}
            t={t}
            onSave={async (locale, value) => {
              await onSaveLocale(locale, value);
            }}
            onSkip={async (locale) => {
              try {
                await onSaveLocale(locale, "");
              } catch {
                // Ignore
              }
            }}
          />
        ))}
      </div>

      {pendingCount > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-3">
          <button
            type="button"
            onClick={handleApplyAll}
            disabled={isApplyingAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isApplyingAll
              ? t("applying")
              : t("applyAll", { count: pendingCount })}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t("dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}

function LocaleRow({
  item,
  editedValue,
  onSave,
  onSkip,
  t,
}: {
  item: NudgePendingLocale;
  editedValue: string;
  onSave: (locale: string, value: string) => Promise<void> | void;
  onSkip: (locale: string) => void;
  t: NudgeTranslator;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftValue, setDraftValue] = useState(item.previousValue);
  const [isSaving, setIsSaving] = useState(false);

  if (item.status === "done") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
        <span className="text-base">{item.flag}</span>
        <span className="font-medium">{item.label}</span>
        <span className="ml-auto text-xs">{t("saved")}</span>
      </div>
    );
  }

  if (item.status === "skipped") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">
        <span className="text-base">{item.flag}</span>
        <span className="font-medium">{item.label}</span>
        <span className="ml-auto text-xs">{t("skipped")}</span>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(item.locale, draftValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white text-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-base">{item.flag}</span>
        <span className="font-medium text-gray-800">{item.label}</span>
        <span className="ml-1 truncate text-xs text-gray-400">
          · &quot;{item.previousValue}&quot;
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                <ChevronUp className="h-3 w-3" /> {t("close")}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> {t("edit")}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSkip(item.locale)}
            className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            {t("skip")}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 px-3 pt-2 pb-3">
          <p className="mb-1.5 text-xs text-gray-400">
            {t("previousValue", { value: item.previousValue })}
          </p>
          <Textarea
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder={t("translationPlaceholder", { label: item.label })}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftValue(editedValue);
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t("copyFromEdited")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !draftValue.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? t("saving") : t("saveLocale", { label: item.label })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
