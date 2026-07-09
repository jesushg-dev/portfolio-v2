import { cn } from "@/lib/utils";

/** Shared chrome for header toolbar controls (locale, theme, menu). */
export function toolbarControlStyles(
  inverted: boolean,
  options?: { active?: boolean; iconOnly?: boolean },
) {
  const { active = false, iconOnly = false } = options ?? {};

  return cn(
    "inline-flex items-center justify-center text-sm font-medium transition-all duration-200 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-offset-0",
    iconOnly
      ? "size-9 min-h-9 min-w-9 shrink-0 rounded-full p-0"
      : "h-9 min-h-9 max-h-9 rounded-full px-3.5",
    inverted
      ? cn(
          "border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md",
          "hover:border-white/25 hover:bg-white/15",
          "focus-visible:ring-white/25",
          active && "border-white/30 bg-white/20",
          "[&_svg]:text-white/75",
        )
      : cn(
          "border-border/55 bg-background/80 text-foreground shadow-sm backdrop-blur-md",
          "hover:border-border hover:bg-accent/45",
          "focus-visible:ring-ring/35",
          active && "border-primary/25 bg-accent/55 text-primary",
        ),
  );
}
