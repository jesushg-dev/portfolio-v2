"use client";

import type { RowData, Table } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataTableBulkBarProps<TData extends RowData = RowData> {
  table?: Table<AppTableFeatures, TData>;
  selectedCount?: number;
  onClearSelection?: () => void;
  onDeleteSelected?:
    | ((selectedRows: TData[]) => void | Promise<void>)
    | (() => void | Promise<void>);
  isDeleting?: boolean;
  selectedText?: string;
  selectedLabel?: string;
  clearText?: string;
  clearLabel?: string;
  deleteText?: string;
  deleteLabel?: string;
  className?: string;
}

export function DataTableBulkBar<TData extends RowData = RowData>({
  table,
  selectedCount: explicitSelectedCount,
  onClearSelection: explicitClearSelection,
  onDeleteSelected,
  isDeleting = false,
  selectedText,
  selectedLabel,
  clearText,
  clearLabel,
  deleteText,
  deleteLabel,
  className,
}: DataTableBulkBarProps<TData>) {
  const selectedRows = table
    ? table.getFilteredSelectedRowModel().rows.map((r) => r.original)
    : [];
  const selectedCount = explicitSelectedCount ?? selectedRows.length;
  const onClearSelection =
    explicitClearSelection ?? (() => table?.resetRowSelection());

  const effectiveSelectedText = selectedLabel ?? selectedText ?? "selected";
  const effectiveClearText = clearLabel ?? clearText ?? "Clear selection";
  const effectiveDeleteText = deleteLabel ?? deleteText ?? "Delete selected";

  if (selectedCount <= 0) return null;

  const handleDelete = () => {
    if (!onDeleteSelected) return;
    void onDeleteSelected(selectedRows);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "border-primary/30 bg-primary/10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2 text-sm transition-all",
        className,
      )}
    >
      <span className="text-foreground flex items-center gap-1.5">
        <b className="font-semibold tabular-nums">{selectedCount}</b>
        <span className="text-muted-foreground">{effectiveSelectedText}</span>
      </span>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="h-8 gap-1.5 text-xs"
        >
          <X className="size-3.5" aria-hidden />
          <span>{effectiveClearText}</span>
        </Button>

        {onDeleteSelected ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 gap-1.5 text-xs"
          >
            <Trash2 className="size-3.5" aria-hidden />
            <span>{effectiveDeleteText}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
