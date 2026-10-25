"use client";

import type { FC } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onDiscard: () => void;
  onSave: () => void;
  t: {
    unsavedChanges: string;
    discard: string;
    saveChanges: string;
    saving: string;
  };
}

export const ProfileSaveBar: FC<ProfileSaveBarProps> = ({
  isDirty,
  isPending,
  errorMessage,
  onDiscard,
  onSave,
  t,
}) => {
  if (!isDirty && !errorMessage) return null;

  return (
    <aside
      aria-label={t.unsavedChanges}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md transition-transform duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {errorMessage ? (
            <>
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <span className="text-destructive truncate font-medium">
                {errorMessage}
              </span>
            </>
          ) : (
            <>
              <span className="size-2 shrink-0 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground truncate font-medium">
                {t.unsavedChanges}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={isPending}
            className="min-h-10 text-xs sm:text-sm"
          >
            {t.discard}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isPending}
            className="min-h-10 gap-1.5 text-xs sm:text-sm font-semibold shadow-md"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <span>{isPending ? t.saving : t.saveChanges}</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
