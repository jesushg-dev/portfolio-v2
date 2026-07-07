"use client";

import { useState, useOptimistic, useCallback, useTransition } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CvLanguageTabs from "@/components/admin/shared/cv/cv-language-tabs";
import { api } from "@/trpc/react";
import { getLocalizedText } from "@/lib/i18n/localized";
import FormStatus from "@/components/admin/shared/form-status";
import CvAddButton from "@/components/admin/shared/cv-add-button";
import CvListItemActions from "@/components/admin/shared/cv-list-item-actions";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { GripVertical } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ExperienceForm } from "./experience-form";
import { CvListSkeleton } from "./cv-list-skeleton";

const ExperiencesList: FC = () => {
  const t = useTranslations("admin.forms.experience");
  const [, startTransition] = useTransition();

  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const remove = api.cv.deleteExperience.useMutation();
  const reorder = api.cv.reorderExperiences.useMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.experiences ?? [],
    (state, newItems: NonNullable<typeof data>["experiences"]) => newItems,
  );

  const handleReorder = useCallback(
    (newItems: NonNullable<typeof data>["experiences"]) => {
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

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setServerError(null);
        try {
          await remove.mutateAsync({ id });
          await utils.cv.getMine.invalidate();
          toast.success(t("save"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : t("deleteFailed");
          toast.error(msg);
          setServerError(msg);
        }
      });
    },
    [remove, utils, t],
  );

  if (isLoading || !data) return <CvListSkeleton lines={2} />;

  const defaultLocale = (data.profile?.defaultLocale as Locale) ?? "en";

  return (
    <div className="flex flex-col gap-5">
      <Sortable
        value={optimisticItems}
        onValueChange={handleReorder}
        getItemValue={(item) => item.id}
      >
        <SortableContent asChild>
          <ul className="flex flex-col gap-2">
            {optimisticItems.map((exp) => (
              <SortableItem key={exp.id} value={exp.id} asChild>
                <li className="bg-muted/40 flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <SortableItemHandle className="text-muted-foreground hover:text-foreground mt-1 shrink-0">
                      <GripVertical className="size-4" />
                    </SortableItemHandle>
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {getLocalizedText(
                          exp.role,
                          defaultLocale,
                          defaultLocale,
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {exp.company} · {exp.dates ?? ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {exp.responsibilities.length} responsibilities
                      </p>
                    </div>
                  </div>
                  <CvListItemActions
                    isEditing={editingId === exp.id}
                    onEditToggle={() =>
                      setEditingId(editingId === exp.id ? null : exp.id)
                    }
                    onDelete={() => handleDelete(exp.id)}
                  />
                </li>
              </SortableItem>
            ))}
          </ul>
        </SortableContent>
      </Sortable>

      <Dialog
        open={!!(editingId ?? creating)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setCreating(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader className="mb-4 flex flex-row items-center justify-between border-b pb-3">
            <DialogTitle>
              {editingId ? t("edit") : t("create")}
            </DialogTitle>
            <CvLanguageTabs />
          </DialogHeader>
          {(editingId ?? creating) && (
            <ExperienceForm
              defaultLocale={defaultLocale}
              initial={
                editingId
                  ? data.experiences.find((e) => e.id === editingId)
                  : undefined
              }
              onCancel={() => {
                setEditingId(null);
                setCreating(false);
              }}
              onSuccess={() => {
                setEditingId(null);
                setCreating(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {!editingId && !creating ? (
        <CvAddButton onClick={() => setCreating(true)}>{t("add")}</CvAddButton>
      ) : null}

      <FormStatus error={serverError} />
    </div>
  );
};

export default ExperiencesList;
