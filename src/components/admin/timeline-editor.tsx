"use client";

import { useState } from "react";
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

// ---------------------------------------------------------------------------
// Single sortable row
// ---------------------------------------------------------------------------

function ExperienceRow({
  entry,
  defaultLocale,
  onSave,
  onDelete,
}: {
  entry: ExperienceEntry;
  defaultLocale: Locale;
  onSave: (entry: ExperienceEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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
    if (!confirm("Delete this experience?")) return;
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
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Summary */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {draft.role.default || "New experience"}
          </p>
          <p className="truncate text-xs text-gray-500">
            {draft.company}
            {draft.dates ? ` · ${draft.dates}` : ""}
            {draft.current ? " (Present)" : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 px-4 pt-3 pb-4">
          {/* Company */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Company / Organization
            </label>
            <input
              type="text"
              value={draft.company}
              onChange={(e) =>
                setDraft((d) => ({ ...d, company: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="e.g. Google"
            />
          </div>

          {/* Role — multilingual */}
          <LocalizedField
            mode="app-locales"
            label="Role / Position"
            value={draft.role}
            onChange={(v) => setDraft((d) => ({ ...d, role: v }))}
            defaultLocale={defaultLocale}
            placeholder="e.g. Frontend Developer"
          />

          {/* Dates + current toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Dates (display string)
              </label>
              <input
                type="text"
                value={draft.dates}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dates: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="e.g. Jan 2022 – Present"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.current}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, current: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                Currently working here
              </label>
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">
                Responsibilities
              </label>
              <button
                type="button"
                onClick={addResponsibility}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
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
                    placeholder="Describe what you did…"
                    multiline
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => removeResponsibility(resp.id)}
                    className="mt-2 shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {draft.responsibilities.length === 0 && (
                <p className="text-xs text-gray-400">
                  No responsibilities added.
                </p>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
          No experience entries yet.
        </p>
      )}

      <button
        type="button"
        onClick={addNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        Add experience
      </button>
    </div>
  );
}
