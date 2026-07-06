"use client";

import { useState } from "react";
import type { FC } from "react";
import { getLocalizedText } from "@/lib/i18n/localized";
import CvAddButton from "@/components/admin/shared/cv-add-button";
import CvListItemActions from "@/components/admin/shared/cv-list-item-actions";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { GripVertical } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CvLanguageTabs from "@/components/admin/shared/cv/cv-language-tabs";
import { type Locale } from "@/i18n/config";
import {
  SimpleLocalizedForm,
  type IItem,
  type ItemInput,
} from "./simple-localized-form";

interface ISimpleLocalizedListProps {
  fieldLabel: string;
  addLabel: string;
  items: IItem[];
  defaultLocale: Locale;
  onCreate: (data: ItemInput) => Promise<unknown> | void;
  onUpdate: (id: string, data: ItemInput) => Promise<unknown> | void;
  onDelete: (id: string) => Promise<unknown> | void;
  onReorder: (items: IItem[]) => void;
  onChanged: () => Promise<void> | void;
}

const SimpleLocalizedList: FC<ISimpleLocalizedListProps> = ({
  fieldLabel,
  addLabel,
  items,
  defaultLocale,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
  onChanged,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Sortable
        value={items}
        onValueChange={onReorder}
        getItemValue={(item) => item.id}
      >
        <SortableContent asChild>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <SortableItem key={item.id} value={item.id} asChild>
                <li className="bg-muted/40 flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <SortableItemHandle className="text-muted-foreground hover:text-foreground mt-1 shrink-0">
                      <GripVertical className="size-4" />
                    </SortableItemHandle>
                    <p className="text-foreground text-sm">
                      {getLocalizedText(
                        item.text,
                        defaultLocale,
                        defaultLocale,
                      )}
                    </p>
                  </div>
                  <CvListItemActions
                    isEditing={editingId === item.id}
                    onEditToggle={() =>
                      setEditingId(editingId === item.id ? null : item.id)
                    }
                    onDelete={async () => {
                      await onDelete(item.id);
                      await onChanged();
                    }}
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
            <DialogTitle>{editingId ? "Edit Item" : "Add Item"}</DialogTitle>
            <CvLanguageTabs />
          </DialogHeader>
          {(editingId ?? creating) && (
            <SimpleLocalizedForm
              fieldLabel={fieldLabel}
              defaultLocale={defaultLocale}
              initial={
                editingId ? items.find((i) => i.id === editingId) : undefined
              }
              onCancel={() => {
                setEditingId(null);
                setCreating(false);
              }}
              onSubmit={async (data) => {
                if (editingId) {
                  await onUpdate(editingId, data);
                } else {
                  await onCreate(data);
                }
                await onChanged();
                setEditingId(null);
                setCreating(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {!editingId && !creating ? (
        <CvAddButton
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
        >
          {addLabel}
        </CvAddButton>
      ) : null}
    </div>
  );
};

export default SimpleLocalizedList;
