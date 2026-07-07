"use client";

import type { ChangeEvent, FC } from "react";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  accentColor?: string;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({
  value,
  accentColor = "#1DB954",
  readOnly = false,
  onChange,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  if (readOnly) {
    return (
      <div
        className={cn("relative h-1 w-full overflow-hidden rounded-full bg-white/20", className)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${clamped}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("group relative h-1 w-full", className)}>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={clamped}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div
        className="pointer-events-none absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        style={{ left: `calc(${clamped}% - 6px)` }}
      />
    </div>
  );
};

export default ProgressBar;
