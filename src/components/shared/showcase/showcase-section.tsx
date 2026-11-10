import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ShowcaseSectionProps {
  id?: string;
  variant?: "default" | "tile-brand" | "tile-dark" | "compact";
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  ariaLabelledBy?: string;
}

export function ShowcaseSection({
  id,
  variant = "default",
  children,
  className,
  containerClassName,
  ariaLabelledBy,
}: ShowcaseSectionProps) {
  if (variant === "tile-brand") {
    return (
      <section
        id={id}
        aria-labelledby={ariaLabelledBy}
        className={cn("py-14 sm:py-20", className)}
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
          <div
            className={cn(
              "from-primary via-primary/90 text-primary-foreground rounded-3xl bg-gradient-to-br to-[var(--brand2)] p-8 shadow-xl sm:p-14",
              containerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "tile-dark") {
    return (
      <section
        id={id}
        aria-labelledby={ariaLabelledBy}
        className={cn("py-14 sm:py-20", className)}
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
          <div
            className={cn(
              "from-card via-card/90 to-background border-border/80 text-foreground rounded-3xl border bg-gradient-to-br p-8 shadow-2xl sm:p-14",
              containerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </section>
    );
  }

  const isCompact = variant === "compact";

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        isCompact
          ? "py-12 md:py-16"
          : "border-border/80 border-t py-20 md:py-28",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:container lg:px-20",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
