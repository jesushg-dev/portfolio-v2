"use client";

import { useFormContext, type FieldPath } from "react-hook-form";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { FormControl, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";
import {
  PROCESS_PAGE_ICON_NAMES,
  type ProcessPageIconName,
} from "@/features/process-pages/lib/process-page-content";
import { PROCESS_PAGE_ICON_MAP } from "@/lib/process-pages/process-page-icons";
import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";

export function CanvasText({
  name,
  placeholder,
  className,
  multiline,
  rows = 2,
}: {
  name: FieldPath<ProcessPageFormValues>;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const { control } = useFormContext<ProcessPageFormValues>();
  const fieldClass = cn(
    "placeholder:text-muted-foreground/60 w-full rounded-md bg-transparent px-1 py-0.5 outline-none",
    "hover:ring-primary/20 focus:ring-primary/35 ring-1 ring-transparent focus:ring-2",
    className,
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormControl>
          {multiline ? (
            <textarea
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              rows={rows}
              placeholder={placeholder}
              className={cn(fieldClass, "resize-none")}
            />
          ) : (
            <input
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              placeholder={placeholder}
              className={fieldClass}
            />
          )}
        </FormControl>
      )}
    />
  );
}

export function CanvasIconPicker({
  name,
}: {
  name: FieldPath<ProcessPageFormValues>;
}) {
  const { control } = useFormContext<ProcessPageFormValues>();
  const t = useTranslations("admin.forms.processPage");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const iconName =
          (field.value as ProcessPageIconName | undefined) ?? "Zap";
        const Icon =
          PROCESS_PAGE_ICON_MAP[iconName] ?? PROCESS_PAGE_ICON_MAP.Zap;
        return (
          <Popover>
            <PopoverTrigger
              type="button"
              className="bg-primary/10 text-primary hover:ring-primary/40 flex size-11 items-center justify-center rounded-xl hover:ring-2"
              aria-label={t("icon")}
            >
              <Icon className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-1">
                {PROCESS_PAGE_ICON_NAMES.map((nameOption) => {
                  const OptionIcon = PROCESS_PAGE_ICON_MAP[nameOption];
                  const selected = nameOption === iconName;
                  return (
                    <button
                      key={nameOption}
                      type="button"
                      className={cn(
                        "hover:bg-muted flex size-10 items-center justify-center rounded-md",
                        selected && "bg-primary/10 text-primary",
                      )}
                      onClick={() => field.onChange(nameOption)}
                      aria-label={nameOption}
                    >
                      <OptionIcon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
}

export function CanvasStringChips({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  const t = useTranslations("admin.forms.processPage");
  const keyed = items.map((value, index) => ({
    id: `chip-${index}-${value.slice(0, 12)}`,
    value,
  }));

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Sortable
        value={keyed}
        getItemValue={(item) => item.id}
        orientation="mixed"
        onMove={({ activeIndex, overIndex }) => {
          const next = [...items];
          const [moved] = next.splice(activeIndex, 1);
          next.splice(overIndex, 0, moved ?? "");
          onChange(next);
        }}
      >
        <SortableContent asChild>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {keyed.map((item, index) => (
              <SortableItem key={item.id} value={item.id}>
                <div className="border-border bg-card flex items-center gap-1 rounded-full border px-2 py-1">
                  <SortableItemHandle
                    aria-label={t("dragToReorder")}
                    className="text-muted-foreground"
                  >
                    <GripVertical className="size-3.5" />
                  </SortableItemHandle>
                  <input
                    value={item.value}
                    placeholder={placeholder}
                    onChange={(event) => {
                      const next = [...items];
                      next[index] = event.target.value;
                      onChange(next);
                    }}
                    className="w-28 bg-transparent text-sm outline-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={t("remove")}
                    onClick={() =>
                      onChange(items.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContent>
      </Sortable>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="mr-1 size-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

export function AddBlockButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground flex min-h-24 w-full items-center justify-center rounded-2xl border border-dashed text-sm"
    >
      <Plus className="mr-2 size-4" />
      {label}
    </button>
  );
}
