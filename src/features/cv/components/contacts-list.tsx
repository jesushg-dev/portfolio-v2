"use client";

import { useState, useOptimistic, useCallback, useTransition } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";
import { GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import FormStatus from "@/components/admin/shared/form-status";
import CvAddButton from "@/components/admin/shared/cv-add-button";
import type { AppLanguage } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CvTranslationBadges } from "./cv-translation-badges";
import { CvReorderButtons } from "./cv-reorder-buttons";
import { ContactForm } from "./contact-form";
import { CvListSkeleton } from "./cv-list-skeleton";

export interface ContactsListProps {
  languages: AppLanguage[];
  displayLocale: Locale;
  onEditItem?: (id: string) => void;
  onAddNew?: () => void;
}

export const ContactsList: FC<ContactsListProps> = ({
  languages,
  onEditItem,
  onAddNew,
}) => {
  const t = useTranslations("admin.forms.contact");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const remove = api.cv.deleteContact.useMutation();
  const reorder = api.cv.reorderContacts.useMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.contacts ?? [],
    (state, newItems: NonNullable<typeof data>["contacts"]) => newItems,
  );

  const [isPending, startTransition] = useTransition();

  const handleReorder = useCallback(
    (newItems: NonNullable<typeof data>["contacts"]) => {
      startTransition(async () => {
        setOptimisticItems(newItems);
        const payload = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));
        try {
          await reorder.mutateAsync(payload);
          await utils.cv.getMine.invalidate();
          toast.success(t("save") || "Saved");
        } catch {
          toast.error(t("saveFailed") || "Save failed");
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
        toast.success(t("deleteSuccess") || "Deleted successfully");
        await utils.cv.getMine.invalidate();
        setPendingDeleteId(null);
      } catch {
        toast.error(t("deleteFailed") || "Delete failed");
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
    const editingContact = editingId
      ? data.contacts.find((c) => c.id === editingId)
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

        <ContactForm
          key={editingId ?? "create"}
          languages={languages}
          initial={editingContact}
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
        <CvAddButton id="cv-contacts-add" onClick={handleAddClick}>
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
              {optimisticItems.map((contact, index) => (
                <SortableItem key={contact.id} value={contact.id} asChild>
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

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[0.625rem] font-bold tracking-wider uppercase">
                          {contact.type}
                        </span>
                      </div>
                      <p className="text-foreground mt-1 truncate font-mono text-sm font-medium">
                        {contact.value}
                      </p>
                    </div>

                    {/* Right: Translation badges & Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <CvTranslationBadges
                        languages={languages}
                        translations={contact.translations}
                        requiredKeys={[]}
                        className="hidden sm:flex"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(contact.id)}
                        className="h-8 text-xs font-medium"
                      >
                        {t("edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDeleteId(contact.id)}
                        aria-label={`${t("delete")} ${contact.value}`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                </SortableItem>
              ))}
            </ul>
          </SortableContent>
        </Sortable>
      )}

      <FormStatus error={serverError} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title={t("delete") || "Delete contact"}
        description="Are you sure you want to delete this contact entry?"
        confirmLabel={t("delete") || "Delete"}
        cancelLabel={t("cancel") || "Cancel"}
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ContactsList;
