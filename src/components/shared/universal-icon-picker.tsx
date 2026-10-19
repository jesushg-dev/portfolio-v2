"use client";

import { useMemo, type FC } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import {
  getIconOptions,
  type IconPreset,
} from "@/lib/icons/icon-registry";
import { cn } from "@/lib/utils";

export interface UniversalIconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  preset?: IconPreset;
  placeholder?: string;
  triggerId?: string;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

/**
 * Universal icon picker component for admin forms and configuration panels.
 * Renders domain icon options with dynamic previews and accessible Select primitives.
 */
export const UniversalIconPicker: FC<UniversalIconPickerProps> = ({
  value,
  onChange,
  preset = "all",
  placeholder = "Select an icon",
  triggerId = "universal-icon-picker",
  disabled = false,
  showPreview = false,
  className,
}) => {
  const options = useMemo(() => getIconOptions(preset), [preset]);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="min-w-0 flex-1">
        <Select
          value={value ?? ""}
          onValueChange={(val) => {
            if (val) onChange(val);
          }}
          disabled={disabled}
        >
          <SelectTrigger id={triggerId} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((option) => (
              <SelectItem
                key={option.key}
                value={option.key}
                id={`${triggerId}-option-${option.key}`}
              >
                <span className="flex items-center gap-2.5">
                  <DynamicIcon
                    name={option.key}
                    className="text-muted-foreground size-4 shrink-0"
                  />
                  <span className="truncate">{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showPreview && (
        <div
          data-testid={`${triggerId}-preview`}
          className="border-border bg-muted/40 flex size-14 shrink-0 items-center justify-center rounded-2xl border transition-colors"
          aria-hidden="true"
        >
          <DynamicIcon name={value} className="text-primary size-7" />
        </div>
      )}
    </div>
  );
};

export default UniversalIconPicker;
