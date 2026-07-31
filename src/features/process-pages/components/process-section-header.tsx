import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  processEyebrowStyles,
  processSectionHeadingId,
} from "./process-page-styles";

interface ProcessSectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  align?: "center" | "left";
  sectionId?: string;
}

export function ProcessSectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = "center",
  sectionId,
}: ProcessSectionHeaderProps) {
  const headingId = sectionId ? processSectionHeadingId(sectionId) : undefined;

  return (
    <div
      className={cn(
        "mb-14",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <p className={cn(processEyebrowStyles, "mb-3")}>{eyebrow}</p>
      <h2
        id={headingId}
        className="text-foreground text-3xl font-extrabold tracking-tight md:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface ProcessPageShellProps {
  children: ReactNode;
}

export function ProcessPageShell({ children }: ProcessPageShellProps) {
  return (
    <main className="bg-background text-foreground min-h-screen pt-24 pb-8">
      {children}
    </main>
  );
}
