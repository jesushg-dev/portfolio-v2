"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RankListItem {
  key: string;
  label: string;
  pageviews: number;
  valueDisplay?: string;
}

export interface RankListProps {
  items: RankListItem[];
  emptyLabel: string;
  valueLabel?: (count: number) => string;
  total?: number;
  showPercentage?: boolean;
  limit?: number;
  showAllLabel?: string;
  showLessLabel?: string;
  actionPlacement?: "header" | "footer";
  onToggleExpand?: (isExpanded: boolean) => void;
  headerSlot?: React.ReactNode;
  variant?: "default" | "line";
}

export function RankList({
  items,
  emptyLabel,
  valueLabel,
  total,
  showPercentage = false,
  limit,
  showAllLabel,
  showLessLabel,
  variant = "default",
}: RankListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  const isLineVariant = variant === "line";
  const max = Math.max(...items.map((i) => i.pageviews), 1);
  const shouldLimit =
    typeof limit === "number" && limit > 0 && items.length > limit;
  const visibleItems =
    shouldLimit && !isExpanded ? items.slice(0, limit) : items;

  return (
    <div className={cn(isLineVariant ? "space-y-1" : "space-y-3.5")}>
      <ul className={cn(isLineVariant ? "space-y-0" : "space-y-3.5")}>
        {visibleItems.map((item) => {
          const isUnknown =
            item.key.toLowerCase() === "unknown" ||
            item.label.toLowerCase() === "unknown" ||
            item.label.toLowerCase() === "desconocido" ||
            item.label.toLowerCase() === "onbekend";

          const pctOfTotal =
            total && total > 0
              ? Math.round((item.pageviews / total) * 100)
              : null;

          const barWidth =
            max > 0
              ? Math.max(1.5, Math.round((item.pageviews / max) * 100))
              : 0;

          return (
            <li key={item.key} className={isLineVariant ? "py-2.5" : undefined}>
              <div
                className={cn(
                  "flex items-baseline justify-between gap-3",
                  isLineVariant ? "text-[0.9375rem]" : "text-sm",
                )}
              >
                <span
                  className={cn(
                    "truncate",
                    isLineVariant
                      ? isUnknown
                        ? "text-muted-foreground font-normal"
                        : "text-foreground font-normal"
                      : isUnknown
                        ? "text-muted-foreground font-medium"
                        : "text-foreground font-medium",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-muted-foreground shrink-0 text-sm whitespace-nowrap tabular-nums">
                  {isLineVariant ? (
                    (item.valueDisplay ??
                    (valueLabel ? valueLabel(item.pageviews) : item.pageviews))
                  ) : (
                    <b className="text-foreground font-semibold">
                      {item.valueDisplay ??
                        (valueLabel
                          ? valueLabel(item.pageviews)
                          : item.pageviews)}
                    </b>
                  )}
                  {showPercentage && pctOfTotal !== null ? (
                    <span className="text-muted-foreground/80 font-normal">
                      {" · "}
                      {pctOfTotal}%
                    </span>
                  ) : null}
                </span>
              </div>
              <div
                className={cn(
                  "overflow-hidden rounded-full",
                  isLineVariant
                    ? "bg-border/60 mt-2.5 h-[0.1875rem]"
                    : "bg-muted/70 mt-1.5 h-1.5",
                )}
                aria-hidden
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isUnknown ? "bg-muted-foreground/60" : "bg-primary",
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {shouldLimit ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-primary hover:text-primary/80 inline-flex items-center text-sm font-medium transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {isExpanded
            ? (showLessLabel ?? "Show less")
            : (showAllLabel ?? `Show all (${items.length})`)}
        </button>
      ) : null}
    </div>
  );
}
