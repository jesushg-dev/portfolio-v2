"use client";

import type { FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCompletenessChecks,
  type ProfileUnifiedState,
} from "../lib/profile-unified-types";

interface ProfileLanguageBarProps {
  languages: AppLanguage[];
  activeLangId: string;
  onSelectLang: (langId: string) => void;
  state: ProfileUnifiedState;
  showReference: boolean;
  onToggleReference: (show: boolean) => void;
  t: {
    baseLabel: string;
    completeStatus: string;
    noTranslationBadge: string;
    allComplete: string;
    missingPrefix: string;
    showReference: string;
    checkSubtitle: string;
    checkTagline: string;
    checkAbout: string;
    checkOutputs: string;
  };
}

export const ProfileLanguageBar: FC<ProfileLanguageBarProps> = ({
  languages,
  activeLangId,
  onSelectLang,
  state,
  showReference,
  onToggleReference,
  t,
}) => {
  const activeTr = state.translations[activeLangId];
  const activeChecks = getCompletenessChecks(activeTr, state.steps.length);
  const checkLabels: Record<string, string> = {
    checkSubtitle: t.checkSubtitle,
    checkTagline: t.checkTagline,
    checkAbout: t.checkAbout,
    checkOutputs: t.checkOutputs,
  };

  const missingItems = activeChecks
    .filter((c) => !c.passed)
    .map((c) => checkLabels[c.labelKey] ?? c.id);

  const baseLang = languages.find((l) => l.isPrimary) ?? languages[0];
  const isViewingNonBase = activeLangId !== baseLang?.id;

  return (
    <div className="border-border/80 bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-16 z-10 border-b px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {/* Language Selection Chips */}
        <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto">
          {languages.map((lang) => {
            const tr = state.translations[lang.id];
            const checks = getCompletenessChecks(tr, state.steps.length);
            const passedCount = checks.filter((c) => c.passed).length;
            const totalCount = checks.length;
            const isComplete = passedCount === totalCount;
            const isSelected = lang.id === activeLangId;
            const hasTr = tr !== null;

            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => onSelectLang(lang.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-w-36 shrink-0 flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isSelected
                    ? "border-primary/60 bg-primary/10 shadow-xs"
                    : "border-border/80 bg-card/60 hover:border-border hover:bg-card",
                  !hasTr && "border-dashed border-border/70 opacity-75",
                )}
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-foreground">{lang.name}</span>
                  {lang.isPrimary && (
                    <span className="bg-primary/20 text-primary rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider">
                      {t.baseLabel}
                    </span>
                  )}
                </span>

                {hasTr ? (
                  <>
                    <span className="bg-muted h-1 w-full overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full transition-all duration-300",
                          isComplete ? "bg-emerald-500" : "bg-primary",
                        )}
                        style={{
                          width: `${Math.round((passedCount / totalCount) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="text-muted-foreground text-[0.6875rem] tabular-nums">
                      {passedCount}/{totalCount} {t.completeStatus}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground/70 text-[0.6875rem]">
                    {t.noTranslationBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Translation Status Summary & Reference Toggle */}
        {activeTr !== null && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                missingItems.length === 0
                  ? "text-emerald-500"
                  : "text-amber-500",
              )}
            >
              {missingItems.length === 0 ? (
                <>
                  <Check className="size-3.5" aria-hidden />
                  <span>{t.allComplete}</span>
                </>
              ) : (
                <span>
                  {t.missingPrefix}: {missingItems.join(", ")}
                </span>
              )}
            </span>

            {isViewingNonBase && (
              <label className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={showReference}
                  onChange={(e) => onToggleReference(e.target.checked)}
                  className="accent-primary size-3.5 rounded"
                />
                <Eye className="size-3.5" aria-hidden />
                <span>{t.showReference}</span>
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
