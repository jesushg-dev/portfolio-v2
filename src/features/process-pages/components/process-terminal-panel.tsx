import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { processDarkBandClass } from "./process-page-styles";

export const processTerminalShellClass = cn(
  "overflow-hidden rounded-2xl shadow-2xl",
  processDarkBandClass,
);

export const processTerminalHeaderClass =
  "flex items-center gap-2 border-b border-white/10 bg-slate-900/90 px-5 py-3";

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
        <span aria-hidden className="size-3 rounded-full bg-red-500/80" />
        <span aria-hidden className="size-3 rounded-full bg-yellow-500/80" />
        <span aria-hidden className="size-3 rounded-full bg-green-500/80" />
        <span className="ml-auto font-mono text-sm text-slate-300">
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
              ? "text-slate-400"
              : index >= lines.length - 3
                ? "text-slate-300"
                : "text-emerald-400"
          }
        >
          {line}
        </p>
      ))}
      <p className="mt-4 text-slate-100">
        {cursorLabel}
        <span className="text-sky-400 motion-safe:animate-pulse">▌</span>
      </p>
    </div>
  );
}
