"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RankListItem {
  key: string;
  label: string;
  pageviews: number;
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
}: RankListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  const max = items[0]?.pageviews ?? 0;
  const shouldLimit =
    typeof limit === "number" && limit > 0 && items.length > limit;
  const visibleItems =
    shouldLimit && !isExpanded ? items.slice(0, limit) : items;

  return (
    <div className="space-y-3.5">
      <ul className="space-y-3.5">
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
            max > 0 ? Math.max(2, Math.round((item.pageviews / max) * 100)) : 0;

          return (
            <li key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span
                  className={cn(
                    "truncate font-medium",
                    isUnknown ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                  <b className="text-foreground font-semibold">
                    {valueLabel ? valueLabel(item.pageviews) : item.pageviews}
                  </b>
                  {showPercentage && pctOfTotal !== null ? (
                    <span className="text-muted-foreground/80 font-normal">
                      {" · "}
                      {pctOfTotal}%
                    </span>
                  ) : null}
                </span>
              </div>
              <div
                className="bg-muted/70 mt-1.5 h-1.5 overflow-hidden rounded-full"
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
