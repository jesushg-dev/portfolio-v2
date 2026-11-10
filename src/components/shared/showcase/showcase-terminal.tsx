import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ShowcaseTerminalProps {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ShowcaseTerminal({
  title,
  children,
  className,
  bodyClassName,
}: ShowcaseTerminalProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-card/85 text-card-foreground overflow-hidden rounded-2xl border shadow-2xl backdrop-blur",
        className,
      )}
    >
      <div className="border-border/80 text-muted-foreground flex items-center gap-1.5 border-b px-4 py-3 text-xs">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
        {title ? (
          <span className="text-muted-foreground ml-auto font-mono text-xs">
            {title}
          </span>
        ) : null}
      </div>
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </div>
  );
}
