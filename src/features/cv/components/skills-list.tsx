"use client";

import { useState, useOptimistic, useCallback, useTransition } from "react";
import type { FC } from "react";

import { useTranslations } from "next-intl";

import { Dialog } from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/shared/form-dialog-content";

import CvLanguageTabs from "@/components/admin/shared/cv/cv-language-tabs";
import { api } from "@/trpc/react";
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
import { toast } from "sonner";

import { SkillForm } from "./skill-form";
import { CvListSkeleton } from "./cv-list-skeleton";

const SkillsList: FC = () => {
  const t = useTranslations("admin.forms.skills");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const remove = api.cv.deleteTechnicalSkill.useMutation();
  const reorder = api.cv.reorderTechnicalSkills.useMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.technicalSkills ?? [],
    (state, newItems: NonNullable<typeof data>["technicalSkills"]) => newItems,
  );

  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleReorder = useCallback(
    (newItems: NonNullable<typeof data>["technicalSkills"]) => {
      startTransition(async () => {
        setOptimisticItems(newItems);
        const payload = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));
        try {
          await reorder.mutateAsync(payload);
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [reorder, utils, t, setOptimisticItems],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      startTransition(async () => {
        setServerError(null);
        try {
          await remove.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("deleteFailed"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [remove, utils, t],
  );

  if (isLoading || !data) return <CvListSkeleton lines={2} />;

  return (
    <div className="flex flex-col gap-5">
      <Sortable
        value={optimisticItems}
        onValueChange={handleReorder}
        getItemValue={(item) => item.id}
      >
        <SortableContent asChild>
          <ul className="flex flex-col gap-2">
            {optimisticItems.map((section) => (
              <SortableItem key={section.id} value={section.id} asChild>
                <li className="bg-muted/40 flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <SortableItemHandle
                      aria-label={t("dragToReorder")}
                      className="text-muted-foreground hover:text-foreground mt-1 shrink-0"
                    >
                      <GripVertical className="size-4" />
                    </SortableItemHandle>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {section.category}
                      </p>
                      <p className="text-foreground text-sm">
                        {section.items.join(", ")}
                      </p>
                    </div>
                  </div>
                  <CvListItemActions
                    isPending={isPending}
                    isDeleting={deletingId === section.id}
                    isEditing={editingId === section.id}
                    onEditToggle={() =>
                      setEditingId(editingId === section.id ? null : section.id)
                    }
                    onDelete={() => handleDelete(section.id)}
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
        <FormDialogContent
          id="cv-item-modal"
          closeButtonId="cv-item-modal-close"
          title={
            editingId
              ? t("edit") || "Editar Habilidad"
              : t("create") || "Añadir Habilidad"
          }
          headerExtra={<CvLanguageTabs />}
          className="sm:max-w-4xl"
        >
          {(editingId ?? creating) && (
            <SkillForm
              initial={
                editingId
                  ? data.technicalSkills.find((s) => s.id === editingId)
                  : undefined
              }
              onSuccess={() => {
                setEditingId(null);
                setCreating(false);
              }}
              onCancel={() => {
                setEditingId(null);
                setCreating(false);
              }}
            />
          )}
        </FormDialogContent>
      </Dialog>

      {!editingId && !creating ? (
        <CvAddButton id="cv-skills-add" onClick={() => setCreating(true)}>
          {t("add")}
        </CvAddButton>
      ) : null}

      <FormStatus error={serverError} />
    </div>
  );
};

export default SkillsList;
