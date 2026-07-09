import type { ReactNode } from "react";
import { Music2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LyricLineContentProps = {
  text: string;
  className?: string;
  iconClassName?: string;
};

/** Renders lyric text, or a music note for instrumental / blank gaps. */
export function LyricLineContent({
  text,
  className,
  iconClassName,
}: LyricLineContentProps): ReactNode {
  if (text.trim()) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("inline-flex items-center", className)} aria-hidden>
      <Music2
        className={cn("size-[0.85em]", iconClassName)}
        strokeWidth={2.25}
      />
    </span>
  );
}
