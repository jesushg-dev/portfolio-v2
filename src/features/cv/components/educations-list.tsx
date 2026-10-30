"use client";

import {
  useState,
  useOptimistic,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import FormStatus from "@/components/admin/shared/form-status";
import CvAddButton from "@/components/admin/shared/cv-add-button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import type { Locale } from "@/i18n/config";
import type { AppLanguage } from "@prisma/client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CvTranslationBadges } from "./cv-translation-badges";
import { CvReorderButtons } from "./cv-reorder-buttons";
import { EducationForm } from "./education-form";
import { CvListSkeleton } from "./cv-list-skeleton";

export interface EducationsListProps {
  languages: AppLanguage[];
  displayLocale: Locale;
  onEditItem?: (id: string) => void;
  onAddNew?: () => void;
}

export const EducationsList: FC<EducationsListProps> = ({
  languages,
  displayLocale,
  onEditItem,
  onAddNew,
}) => {
  const t = useTranslations("admin.forms.education");

  const field = useMemo(
    () => createLocalizedFieldResolver(languages, displayLocale),
    [languages, displayLocale],
  );

  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const remove = api.cv.deleteEducation.useMutation();
  const reorder = api.cv.reorderEducations.useMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.educations ?? [],
    (state, newItems: NonNullable<typeof data>["educations"]) => newItems,
  );

  const [isPending, startTransition] = useTransition();

  const handleReorder = useCallback(
    (newItems: NonNullable<typeof data>["educations"]) => {
      startTransition(async () => {
        setOptimisticItems(newItems);
        const payload = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));
        try {
          await reorder.mutateAsync(payload);
          await utils.cv.getMine.invalidate();
          toast.success(t("save"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : t("saveFailed");
          toast.error(msg);
          setServerError(msg);
        }
      });
    },
    [reorder, utils, t, setOptimisticItems],
  );

  const handleMove = useCallback(
    (index: number, delta: -1 | 1) => {
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= optimisticItems.length) return;
      const copy = [...optimisticItems];
      const temp = copy[index];
      const target = copy[targetIndex];
      if (!temp || !target) return;
      copy[index] = target;
      copy[targetIndex] = temp;
      handleReorder(copy);
    },
    [optimisticItems, handleReorder],
  );

  const handleDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    startTransition(async () => {
      setServerError(null);
      try {
        await remove.mutateAsync({ id: idToDelete });
        await utils.cv.getMine.invalidate();
        toast.success(t("save"));
        setPendingDeleteId(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("deleteFailed");
        toast.error(msg);
        setServerError(msg);
      }
    });
  }, [pendingDeleteId, remove, utils, t]);

  const handleEditClick = (id: string) => {
    if (onEditItem) {
      onEditItem(id);
    } else {
      setEditingId(id);
    }
  };

  const handleAddClick = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      setCreating(true);
    }
  };

  if (isLoading || !data || languages.length === 0) {
    return <CvListSkeleton lines={2} />;
  }

  // Standalone fallback: render inline form only if no external onEditItem handler
  if (!onEditItem && (editingId ?? creating)) {
    const editingEdu = editingId
      ? data.educations.find((e) => e.id === editingId)
      : undefined;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-start pb-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setCreating(false);
            }}
            className="text-xs"
          >
            ← {t("cancel")}
          </Button>
        </div>

        <EducationForm
          key={editingId ?? "create"}
          languages={languages}
          initial={editingEdu}
          onCancel={() => {
            setEditingId(null);
            setCreating(false);
          }}
          onSuccess={() => {
            setEditingId(null);
            setCreating(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs sm:text-sm">
          {t("entriesCount", { count: optimisticItems.length })}
        </p>
        <CvAddButton id="cv-education-add" onClick={handleAddClick}>
          {t("add")}
        </CvAddButton>
      </div>

      {optimisticItems.length === 0 ? (
        <p className="border-border bg-card/50 text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
          {t("noEntries")}
        </p>
      ) : (
        <Sortable
          value={optimisticItems}
          onValueChange={handleReorder}
          getItemValue={(item) => item.id}
        >
          <SortableContent asChild>
            <ul className="flex flex-col gap-2.5">
              {optimisticItems.map((edu, index) => {
                const degreeName =
                  field(edu.translations, "degreeName") || "(No degree)";
                const datesDisplay = edu.dates?.trim()
                  ? edu.dates
                  : edu.startYear
                    ? `${edu.startYear} – ${edu.endYear ?? "Present"}`
                    : "";
                const location = field(edu.translations, "location");

                return (
                  <SortableItem key={edu.id} value={edu.id} asChild>
                    <li className="border-border/80 bg-card/60 hover:border-border hover:bg-card flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xs transition-colors sm:p-4">
                      {/* Left: Reorder controls + Drag handle */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <CvReorderButtons
                          index={index}
                          total={optimisticItems.length}
                          disabled={isPending}
                          onMoveUp={() => handleMove(index, -1)}
                          onMoveDown={() => handleMove(index, 1)}
                        />
                        <SortableItemHandle
                          aria-label={t("dragToReorder")}
                          className="text-muted-foreground/60 hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="size-4" />
                        </SortableItemHandle>
                      </div>

                      {/* Content: Degree Title & Institution / Dates */}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-semibold">
                          {degreeName}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          <span className="text-foreground/90 font-medium">
                            {edu.institution}
                          </span>
                          {datesDisplay ? ` · ${datesDisplay}` : ""}
                          {location ? ` · ${location}` : ""}
                        </p>
                      </div>

                      {/* Right: Translation badges & Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <CvTranslationBadges
                          languages={languages}
                          translations={edu.translations}
                          requiredKeys={["degreeName"]}
                          className="hidden sm:flex"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(edu.id)}
                          className="h-8 text-xs font-medium"
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDeleteId(edu.id)}
                          aria-label={`${t("delete")} ${edu.institution}`}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  </SortableItem>
                );
              })}
            </ul>
          </SortableContent>
        </Sortable>
      )}

      <FormStatus error={serverError} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title={t("delete") || "Delete education"}
        description="Are you sure you want to delete this education entry?"
        confirmLabel={t("delete") || "Delete"}
        cancelLabel={t("cancel") || "Cancel"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default EducationsList;
