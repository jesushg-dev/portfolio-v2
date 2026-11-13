"use client";

import type { FC, KeyboardEvent, ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ResumeOptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  iconWellClassName?: string;
  disabled?: boolean;
  className?: string;
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  role?: "radio" | "button";
  indicatorSize?: "sm" | "default";
}

export const ResumeOptionCard: FC<ResumeOptionCardProps> = ({
  selected,
  onSelect,
  title,
  subtitle,
  badge,
  icon,
  iconWellClassName,
  disabled = false,
  className,
  tabIndex,
  onKeyDown,
  role = "radio",
  indicatorSize = "default",
}) => {
  const isSm = indicatorSize === "sm";

  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "radio" ? selected : undefined}
      aria-disabled={disabled}
      tabIndex={tabIndex ?? (selected ? 0 : -1)}
      disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all outline-none select-none",
        "focus-visible:ring-ring focus-visible:ring-2",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs text-card-foreground"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/20 text-card-foreground",
        disabled &&
          "cursor-not-allowed opacity-50 hover:border-border hover:bg-card",
        className,
      )}
    >
      {/* Optional Icon / Preview Well */}
      {icon ? (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30 transition-colors group-hover:bg-muted/50",
            iconWellClassName ?? "h-16 w-13 p-0.5",
          )}
        >
          {icon}
        </div>
      ) : null}

      {/* Content Details */}
      <div className="min-w-0 flex-1 space-y-0.5 pr-5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-foreground text-xs font-semibold tracking-tight">
            {title}
          </span>
          {badge}
        </div>
        {subtitle ? (
          <p className="text-muted-foreground line-clamp-2 text-[0.625rem] leading-snug sm:text-[0.6875rem]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Radio Check Indicator (Top Right) */}
      <div
        className={cn(
          "absolute flex items-center justify-center rounded-full transition-colors",
          isSm ? "top-2 right-2 size-3.5" : "top-2 right-2 size-4",
          selected
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "border-border/80 bg-background/90 text-transparent border shadow-2xs group-hover:border-primary/50",
          disabled && "border-border/50 bg-muted/40",
        )}
        aria-hidden="true"
      >
        <Check
          className={cn(
            isSm ? "size-2 stroke-[2.5]" : "size-2.5 stroke-[2.5]",
            selected ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </button>
  );
};

