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
        "mb-16 md:mb-18",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <p className={cn(processEyebrowStyles, "mb-3")}>{eyebrow}</p>
      <h2
        id={headingId}
        className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
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
    <main className="bg-background text-foreground min-h-screen">
      {children}
    </main>
  );
}
