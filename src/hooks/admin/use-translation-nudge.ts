"use client";

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NudgePendingLocale {
  locale: string;
  /** Display name, e.g. "English" */
  label: string;
  /** Emoji flag, e.g. "🇬🇧" */
  flag: string;
  /** The value that was stored BEFORE the edit */
  previousValue: string;
  status: "pending" | "skipped" | "done";
}

export interface TranslationNudgeState {
  /** Storage key — unique per entity + field */
  storageKey: string;
  /** Human-readable field name shown in the banner, e.g. "Professional title" */
  fieldLabel: string;
  /** The locale the user just saved in, e.g. "es" */
  editedLocale: string;
  /** The new value the user just saved */
  editedValue: string;
  /** Locales that still need to be reviewed */
  pendingLocales: NudgePendingLocale[];
}

interface TriggerNudgeOptions {
  /** Unique key for sessionStorage, e.g. `"header_degree"` or `"proj_${id}_title"` */
  storageKey: string;
  fieldLabel: string;
  editedLocale: string;
  editedValue: string;
  /**
   * Map of locale → current stored value for every OTHER locale.
   * Only locales with a non-empty value are included in the nudge.
   */
  otherLocaleValues: Record<
    string,
    { label: string; flag: string; value: string }
  >;
}

// ---------------------------------------------------------------------------
// Session-storage helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "translation_nudge_";

function loadFromStorage(storageKey: string): TranslationNudgeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
    return raw ? (JSON.parse(raw) as TranslationNudgeState) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state: TranslationNudgeState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_PREFIX + state.storageKey,
      JSON.stringify(state),
    );
  } catch {
    // ignore quota errors
  }
}

function clearFromStorage(storageKey: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_PREFIX + storageKey);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTranslationNudge(storageKey: string) {
  const [nudge, setNudge] = useState<TranslationNudgeState | null>(() =>
    loadFromStorage(storageKey),
  );

  // Sync to sessionStorage whenever state changes
  useEffect(() => {
    if (nudge) {
      saveToStorage(nudge);
    } else {
      clearFromStorage(storageKey);
    }
  }, [nudge, storageKey]);

  /**
   * Call this right after a successful save mutation to trigger the nudge.
   * Locales with an empty `value` in `otherLocaleValues` are ignored.
   */
  const triggerNudge = useCallback((opts: TriggerNudgeOptions) => {
    const pending: NudgePendingLocale[] = Object.entries(opts.otherLocaleValues)
      .filter(([, info]) => info.value.trim() !== "") // only locales that already have content
      .map(([locale, info]) => ({
        locale,
        label: info.label,
        flag: info.flag,
        previousValue: info.value,
        status: "pending" as const,
      }));

    // Don't nudge if there's nothing to update
    if (pending.length === 0) return;

    const state: TranslationNudgeState = {
      storageKey: opts.storageKey,
      fieldLabel: opts.fieldLabel,
      editedLocale: opts.editedLocale,
      editedValue: opts.editedValue,
      pendingLocales: pending,
    };
    setNudge(state);
  }, []);

  /** Mark a locale as done (translation was saved). */
  const markDone = useCallback((locale: string) => {
    setNudge((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        pendingLocales: prev.pendingLocales.map((p) =>
          p.locale === locale ? { ...p, status: "done" as const } : p,
        ),
      };
      // Auto-dismiss when all are done or skipped
      const allResolved = updated.pendingLocales.every(
        (p) => p.status === "done" || p.status === "skipped",
      );
      return allResolved ? null : updated;
    });
  }, []);

  /** Mark a locale as skipped (user chose to not translate now). */
  const markSkipped = useCallback((locale: string) => {
    setNudge((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        pendingLocales: prev.pendingLocales.map((p) =>
          p.locale === locale ? { ...p, status: "skipped" as const } : p,
        ),
      };
      const allResolved = updated.pendingLocales.every(
        (p) => p.status === "done" || p.status === "skipped",
      );
      return allResolved ? null : updated;
    });
  }, []);

  /** Mark all pending locales as done at once (used by "apply to all"). */
  const markAllDone = useCallback(() => {
    setNudge(null);
  }, []);

  /** Dismiss the nudge entirely without resolving. */
  const dismiss = useCallback(() => {
    setNudge(null);
  }, []);

  return { nudge, triggerNudge, markDone, markSkipped, markAllDone, dismiss };
}
