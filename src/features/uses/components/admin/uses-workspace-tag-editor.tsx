"use client";

import { MediaImage } from "@/components/shared/media-image";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type UsesItemEditorDTO,
  usesItemEditorTitle,
} from "@/features/uses/lib/uses-editor-dto";
import { pointerToPercent } from "@/features/uses/lib/workspace-tag-coords";

export interface UsesWorkspaceTagDraft {
  clientId?: string;
  usesItemId: string;
  xPercent: number;
  yPercent: number;
  order: number;
}

interface UsesWorkspaceTagEditorProps {
  imageSrc: string;
  tags: UsesWorkspaceTagDraft[];
  items: UsesItemEditorDTO[];
  activeLangId: string;
  onAdd: (tag: UsesWorkspaceTagDraft) => void;
  onUpdate: (index: number, tag: UsesWorkspaceTagDraft) => void;
  onRemove: (index: number) => void;
}

interface DragState {
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface Anchor {
  xPercent: number;
  yPercent: number;
}

function isPreviewableSrc(src: string): boolean {
  return (
    src.startsWith("/") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  );
}

export function UsesWorkspaceTagEditor({
  imageSrc,
  tags,
  items,
  activeLangId,
  onAdd,
  onUpdate,
  onRemove,
}: UsesWorkspaceTagEditorProps) {
  const t = useTranslations("admin.forms.usesSettings");
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const skipPinClickRef = useRef(false);
  // `window.setTimeout` returns a number in the DOM lib (Node's `Timeout` overload does not apply here).
  const openTimerRef = useRef<number>(0);
  const anchorRef = useRef<Anchor | null>(null);
  const editingIndexRef = useRef<number | null>(null);

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const taggedItemIds = useMemo(() => {
    const used = new Set<string>();
    for (const tag of tags) {
      if (tag.usesItemId) used.add(tag.usesItemId);
    }
    return used;
  }, [tags]);

  const everydayItems = useMemo(
    () => items.filter((item) => item.type === "EVERYDAY"),
    [items],
  );
  const softwareItems = useMemo(
    () => items.filter((item) => item.type === "SOFTWARE"),
    [items],
  );

  const editingTag =
    editingIndex === null ? null : (tags[editingIndex] ?? null);

  const itemLabel = useCallback(
    (item: UsesItemEditorDTO) =>
      usesItemEditorTitle(item, activeLangId) || t("untitledItem"),
    [activeLangId, t],
  );

  const clearOpenTimer = useCallback(() => {
    window.clearTimeout(openTimerRef.current);
  }, []);

  const closePicker = useCallback(() => {
    clearOpenTimer();
    anchorRef.current = null;
    editingIndexRef.current = null;
    setAnchor(null);
    setEditingIndex(null);
    setPickerOpen(false);
  }, [clearOpenTimer]);

  const openPickerAfterClick = useCallback(() => {
    clearOpenTimer();
    // Wait until the originating click/pointerup finishes so it cannot dismiss the dialog.
    openTimerRef.current = window.setTimeout(() => {
      setPickerOpen(true);
    }, 0);
  }, [clearOpenTimer]);

  const pickItem = useCallback(
    (itemId: string) => {
      const pending = anchorRef.current;
      const editing = editingIndexRef.current;
      if (pending) {
        onAdd({
          usesItemId: itemId,
          xPercent: pending.xPercent,
          yPercent: pending.yPercent,
          order: tags.length,
        });
      } else if (editing !== null) {
        const tag = tags[editing];
        if (tag) onUpdate(editing, { ...tag, usesItemId: itemId });
      }
      closePicker();
    },
    [closePicker, onAdd, onUpdate, tags],
  );

  const updateCoords = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const box = imageBoxRef.current;
      if (!box) return;
      const tag = tags[index];
      if (!tag) return;
      const { xPercent, yPercent } = pointerToPercent(
        clientX,
        clientY,
        box.getBoundingClientRect(),
      );
      onUpdate(index, { ...tag, xPercent, yPercent });
    },
    [onUpdate, tags],
  );

  const handleImageClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const { xPercent, yPercent } = pointerToPercent(
        event.clientX,
        event.clientY,
        event.currentTarget.getBoundingClientRect(),
      );
      const nextAnchor = { xPercent, yPercent };
      editingIndexRef.current = null;
      anchorRef.current = nextAnchor;
      setEditingIndex(null);
      setAnchor(nextAnchor);
      openPickerAfterClick();
    },
    [openPickerAfterClick],
  );

  const handlePinPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        index,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
    },
    [],
  );

  const handlePinPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (drag?.pointerId !== event.pointerId) return;
      const distance = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      if (!drag.moved && distance < 4) return;
      drag.moved = true;
      updateCoords(drag.index, event.clientX, event.clientY);
    },
    [updateCoords],
  );

  const handlePinPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (drag?.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      skipPinClickRef.current = Boolean(drag.moved);
      dragRef.current = null;
    },
    [],
  );

  const handlePinClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, index: number) => {
      event.stopPropagation();
      if (skipPinClickRef.current) {
        skipPinClickRef.current = false;
        return;
      }
      anchorRef.current = null;
      editingIndexRef.current = index;
      setAnchor(null);
      setEditingIndex(index);
      openPickerAfterClick();
    },
    [openPickerAfterClick],
  );

  const showPreview = isPreviewableSrc(imageSrc.trim());

  const renderItemButton = (item: UsesItemEditorDTO) => {
    const taken =
      taggedItemIds.has(item.id) && item.id !== editingTag?.usesItemId;
    const label = itemLabel(item);
    const checked = item.id === editingTag?.usesItemId;

    return (
      <CommandItem
        key={item.id}
        value={`${label} ${item.type}`}
        disabled={taken}
        data-checked={checked || undefined}
        onSelect={() => {
          if (taken) return;
          pickItem(item.id);
        }}
      >
        {item.image ? (
          <span className="relative size-8 shrink-0 overflow-hidden rounded-md">
            <MediaImage
              src={item.image}
              alt=""
              fill
              sizes="2rem"
              className="object-contain"
            />
          </span>
        ) : (
          <span className="bg-muted size-8 shrink-0 rounded-md" />
        )}
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </CommandItem>
    );
  };

  return (
    <div className="space-y-3">
      {showPreview ? (
        <div
          ref={imageBoxRef}
          role="presentation"
          onClick={handleImageClick}
          className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-xl"
        >
          <div className="pointer-events-none absolute inset-0">
            <MediaImage
              src={imageSrc.trim()}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center select-none"
            />
          </div>
          {tags.map((tag, index) => {
            const title = items.find((item) => item.id === tag.usesItemId);
            const label = title ? itemLabel(title) : t("selectItemPlaceholder");
            return (
              <button
                key={tag.clientId ?? `${tag.usesItemId}-${index}`}
                type="button"
                aria-label={label}
                aria-pressed={editingIndex === index}
                onClick={(event) => handlePinClick(event, index)}
                onPointerDown={(event) => handlePinPointerDown(event, index)}
                onPointerMove={handlePinPointerMove}
                onPointerUp={handlePinPointerUp}
                onPointerCancel={handlePinPointerUp}
                className={cn(
                  "absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full",
                  editingIndex === index && "z-20",
                )}
                style={{
                  left: `${tag.xPercent}%`,
                  top: `${tag.yPercent}%`,
                }}
              >
                <span
                  className={cn(
                    "bg-primary ring-background size-3 rounded-full ring-2",
                    editingIndex === index && "ring-primary ring-offset-2",
                  )}
                />
              </button>
            );
          })}
          {anchor ? (
            <span
              aria-hidden
              className="pointer-events-none absolute z-20 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{
                left: `${anchor.xPercent}%`,
                top: `${anchor.yPercent}%`,
              }}
            >
              <span className="bg-primary ring-primary size-3 rounded-full ring-2 ring-offset-2" />
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noImageHint")}</p>
      )}

      {showPreview && tags.length === 0 && !anchor ? (
        <p className="text-muted-foreground text-sm">{t("emptyTags")}</p>
      ) : null}

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          if (!open) closePicker();
        }}
      >
        <DialogContent
          className="gap-0 overflow-hidden p-0 sm:max-w-md"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.stopPropagation();
          }}
        >
          <DialogHeader className="p-4 pr-12 pb-2">
            <DialogTitle>{t("selectItem")}</DialogTitle>
            <DialogDescription>{t("selectItemDescription")}</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder={t("searchItem")} />
            <CommandList>
              <CommandEmpty>{t("noMatchingItems")}</CommandEmpty>
              {everydayItems.length > 0 ? (
                <CommandGroup heading={t("groupEveryday")}>
                  {everydayItems.map(renderItemButton)}
                </CommandGroup>
              ) : null}
              {softwareItems.length > 0 ? (
                <CommandGroup heading={t("groupSoftware")}>
                  {softwareItems.map(renderItemButton)}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
          {editingIndex !== null ? (
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onRemove(editingIndex);
                  closePicker();
                }}
              >
                <Trash2 className="mr-1 size-4" />
                {t("deleteTag")}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
