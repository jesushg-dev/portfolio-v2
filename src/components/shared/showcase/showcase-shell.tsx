import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShowcaseShellProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function ShowcaseShell({
  children,
  className,
  as: Component = "main",
}: ShowcaseShellProps) {
  return (
    <Component
      className={cn(
        "bg-background text-foreground relative min-h-screen",
        className,
      )}
    >
      {children}
    </Component>
  );
}
