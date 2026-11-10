import type { ReactNode } from "react";

export function HeadingAccent({ children }: { children: ReactNode }) {
  return (
    <span className="from-primary via-primary/80 bg-linear-to-r to-[var(--brand2)] bg-clip-text text-transparent">
      {children}
    </span>
  );
}
