"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";

import type { Locale } from "@/i18n/config";
import { LocalizedField } from "@/components/admin/localized-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExperienceEntry {
  /** Existing DB id, or a client-only temp id for new entries */
  id: string;
  company: string;
  /** LocalizedText */
  role: { default: string; translations?: Partial<Record<Locale, string>> };
  dates: string;
  current: boolean;
  responsibilities: {
    id: string;
    text: { default: string; translations?: Partial<Record<Locale, string>> };
  }[];
  /** "new" means not yet persisted to DB */
  _status?: "new" | "dirty" | "saved";
}

interface TimelineEditorProps {
  entries: ExperienceEntry[];
  defaultLocale: Locale;
  onSave: (entry: ExperienceEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => void;
}

type ExperienceTranslator = ReturnType<
  typeof useTranslations<"admin.forms.experience">
>;

// ---------------------------------------------------------------------------
// Timeline editor
// ---------------------------------------------------------------------------

export function TimelineEditor({
  entries,
  defaultLocale,
  onSave,
  onDelete,
  onReorder,
}: TimelineEditorProps) {
  const t = useTranslations("admin.forms.experience");
  const [items, setItems] = useState(entries);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder(reordered.map((i) => i.id));
  };

  const addNew = () => {
    const tempId = `new_${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        company: "",
        role: { default: "" },
        dates: "",
        current: false,
        responsibilities: [],
        _status: "new",
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((entry) => (
            <ExperienceRow
              key={entry.id}
              entry={entry}
              defaultLocale={defaultLocale}
              t={t}
              onSave={async (saved) => {
                await onSave(saved);
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === saved.id ? { ...saved, _status: "saved" } : i,
                  ),
                );
              }}
              onDelete={async (id) => {
                await onDelete(id);
                setItems((prev) => prev.filter((i) => i.id !== id));
              }}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          {t("noEntries")}
        </p>
      )}

      <Button
        variant="outline"
        type="button"
        onClick={addNew}
        className="w-full border-dashed"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addExperience")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single sortable row
// ---------------------------------------------------------------------------

function ExperienceRow({
  entry,
  defaultLocale,
  onSave,
  onDelete,
  t,
}: {
  entry: ExperienceEntry;
  defaultLocale: Locale;
  onSave: (entry: ExperienceEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  t: ExperienceTranslator;
}) {
  const [isOpen, setIsOpen] = useState(entry._status === "new");
  const [draft, setDraft] = useState<ExperienceEntry>(entry);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const addResponsibility = () => {
    setDraft((d) => ({
      ...d,
      responsibilities: [
        ...d.responsibilities,
        {
          id: `resp_${Date.now()}`,
          text: { default: "" },
        },
      ],
    }));
  };

  const removeResponsibility = (respId: string) => {
    setDraft((d) => ({
      ...d,
      responsibilities: d.responsibilities.filter((r) => r.id !== respId),
    }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-200 bg-white"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          aria-label={t("dragToReorder")}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Summary */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {draft.role.default || t("newEntry")}
          </p>
          <p className="truncate text-xs text-gray-500">
            {draft.company}
            {draft.dates ? ` · ${draft.dates}` : ""}
            {draft.current ? ` (${t("present")})` : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {
              void handleDelete();
            }}
            disabled={isDeleting}
            className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label={t("remove")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="h-8 w-8 text-gray-400"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded editor */}
      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 px-4 pt-3 pb-4">
          {/* Company */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              {t("company")}
            </Label>
            <Input
              type="text"
              value={draft.company}
              onChange={(e) =>
                setDraft((d) => ({ ...d, company: e.target.value }))
              }
              placeholder={t("companyPlaceholder")}
            />
          </div>

          <LocalizedField
            mode="app-locales"
            label={t("role")}
            value={draft.role}
            onChange={(v) => setDraft((d) => ({ ...d, role: v }))}
            defaultLocale={defaultLocale}
            placeholder={t("rolePlaceholder")}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">
                {t("datesDisplay")}
              </Label>
              <Input
                type="text"
                value={draft.dates}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dates: e.target.value }))
                }
                placeholder={t("datesPlaceholder")}
              />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`current-${entry.id}`}
                  checked={draft.current}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, current: checked === true }))
                  }
                />
                <Label
                  htmlFor={`current-${entry.id}`}
                  className="cursor-pointer text-sm text-gray-700"
                >
                  {t("currentlyWorking")}
                </Label>
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-600">
                {t("responsibilities")}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={addResponsibility}
                className="h-7 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("addLabel")}
              </Button>
            </div>
            <div className="space-y-2">
              {draft.responsibilities.map((resp, idx) => (
                <div key={resp.id} className="flex items-start gap-2">
                  <span className="mt-2.5 shrink-0 text-xs text-gray-300">
                    {idx + 1}.
                  </span>
                  <LocalizedField
                    mode="app-locales"
                    label=""
                    value={resp.text}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        responsibilities: d.responsibilities.map((r) =>
                          r.id === resp.id ? { ...r, text: v } : r,
                        ),
                      }))
                    }
                    defaultLocale={defaultLocale}
                    placeholder={t("responsibilityPlaceholder")}
                    multiline
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => removeResponsibility(resp.id)}
                    className="mt-2 h-7 w-7 shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {draft.responsibilities.length === 0 && (
                <p className="text-xs text-gray-400">
                  {t("noResponsibilities")}
                </p>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}
            >
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
