"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface CategoryChipOption {
  value?: string;
  id?: string;
  label: string;
  count?: number;
}

export interface DataTableCategoryChipsProps {
  chips: CategoryChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function DataTableCategoryChips({
  chips = [],
  value,
  onChange,
  className,
  ariaLabel = "Filter by category",
}: DataTableCategoryChipsProps) {
  if (!chips || chips.length <= 1) return null;

  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain",
        className,
      )}
      role="region"
      aria-label={ariaLabel}
    >
      <Tabs
        className="w-max min-w-full"
        value={value}
        onValueChange={(val) => {
          if (typeof val === "string") onChange(val);
        }}
      >
        <TabsList
          variant="pill"
          className="h-auto w-max min-w-full justify-start gap-1.5 border-0 bg-transparent p-0"
        >
          {chips.map((chip) => {
            const chipVal = chip.value ?? chip.id ?? "";
            return (
              <TabsTrigger
                key={chipVal}
                value={chipVal}
                className="inline-flex min-h-8 items-center gap-1.5 px-3.5 text-xs font-medium"
              >
                <span>{chip.label}</span>
                {typeof chip.count === "number" && (
                  <span className="text-[10px] tabular-nums opacity-75">
                    {chip.count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
