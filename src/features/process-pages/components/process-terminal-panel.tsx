import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const processTerminalShellClass =
  "overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl";

export const processTerminalHeaderClass =
  "flex items-center gap-2 border-b border-border/80 bg-muted/40 px-5 py-3";

interface ProcessTerminalPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
}

export function ProcessTerminalPanel({
  title,
  children,
  className,
  badge,
}: ProcessTerminalPanelProps) {
  return (
    <div className={cn(processTerminalShellClass, className)}>
      <div className={processTerminalHeaderClass}>
        <span aria-hidden className="size-2.5 rounded-full bg-red-500/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-yellow-500/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-green-500/80" />
        <span className="text-muted-foreground ml-auto font-mono text-sm">
          {title}
        </span>
        {badge}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

interface ProcessTestRunnerOutputProps {
  lines: string[];
  cursorLabel?: string;
}

export function ProcessTestRunnerOutput({
  lines,
  cursorLabel = "",
}: ProcessTestRunnerOutputProps) {
  return (
    <div className="overflow-x-auto font-mono text-sm leading-relaxed">
      {lines.map((line, index) => (
        <p
          key={`${line}-${index}`}
          className={
            index === 0
              ? "text-foreground font-semibold"
              : index >= lines.length - 3
                ? "text-foreground"
                : "text-emerald-500"
          }
        >
          {line}
        </p>
      ))}
      <p className="text-foreground mt-4">
        {cursorLabel}
        <span className="text-primary motion-safe:animate-pulse">▌</span>
      </p>
    </div>
  );
}
