import { cn } from "@/lib/utils";

/** Shared height for every header control (nav, locale, theme, menu). */
export const headerControlHeight = "h-9 min-h-9 max-h-9";

/** Shared label typography for nav links and locale text. */
export const headerLabelTextStyles =
  "text-xs sm:text-sm font-medium leading-none tracking-normal text-foreground";

interface ControlOptions {
  active?: boolean;
  iconOnly?: boolean;
}

/** Icon controls (theme, mobile menu): bordered, matches locale pill. */
export function headerIconControlStyles(
  inverted = false,
  options?: ControlOptions,
) {
  const { active = false } = options ?? {};

  return cn(
    headerControlHeight,
    "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full p-0",
    "border backdrop-blur-md transition-all duration-200 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-offset-0",
    inverted
      ? cn(
          "border-white/20 bg-transparent text-white hover:bg-white/10",
          "focus-visible:ring-white/25",
          active && "border-white/30 bg-white/10",
        )
      : cn(
          "border-border/40 bg-transparent text-foreground hover:border-primary/20 hover:bg-accent/40",
          "focus-visible:ring-ring/35",
          active && "border-primary/30 bg-primary/10 text-primary",
        ),
  );
}

/** Pill controls (locale): transparent fill, bordered, same height as icons. */
export function headerPillControlStyles(
  inverted = false,
  options?: ControlOptions,
) {
  const { active = false } = options ?? {};

  return cn(
    headerControlHeight,
    headerLabelTextStyles,
    "inline-flex w-auto cursor-pointer items-center rounded-full px-2.5",
    "border backdrop-blur-md transition-all duration-200 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-offset-0",
    inverted
      ? cn(
          "border-white/20 bg-transparent text-white hover:bg-white/10",
          "focus-visible:ring-white/25",
          active && "border-white/30 bg-white/10",
        )
      : cn(
          "border-border/40 bg-transparent text-foreground hover:border-primary/20 hover:bg-accent/40",
          "focus-visible:ring-ring/35",
          active && "border-primary/30 bg-primary/10 text-primary",
        ),
  );
}

/** Center nav triggers: transparent, no border, same typography and height. */
export function headerNavTriggerStyles(isActive = false) {
  return cn(
    headerControlHeight,
    headerLabelTextStyles,
    "inline-flex cursor-pointer items-center gap-0.5 rounded-full px-3 transition-all duration-300 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
    isActive
      ? "bg-primary/15 text-primary font-semibold shadow-2xs"
      : "bg-transparent hover:bg-accent/50 hover:text-foreground active:scale-[0.98]",
  );
}

/** @deprecated Use headerIconControlStyles or headerPillControlStyles. */
export function toolbarControlStyles(
  inverted: boolean,
  options?: ControlOptions,
) {
  const { iconOnly = false, active = false } = options ?? {};
  return iconOnly
    ? headerIconControlStyles(inverted, { active })
    : headerPillControlStyles(inverted, { active });
}
