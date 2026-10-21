import { cn } from "@/lib/utils";

export interface RankListItem {
  key: string;
  label: string;
  pageviews: number;
}

export function RankList({
  items,
  emptyLabel,
  valueLabel,
}: {
  items: RankListItem[];
  emptyLabel: string;
  valueLabel: (count: number) => string;
}) {
  const max = items[0]?.pageviews ?? 0;

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const width = max > 0 ? Math.max(4, (item.pageviews / max) * 100) : 0;
        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-foreground truncate text-sm font-medium">
                {item.label}
              </span>
              <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                {valueLabel(item.pageviews)}
              </span>
            </div>
            <div
              className="bg-muted h-2 overflow-hidden rounded-full"
              aria-hidden
            >
              <div
                className={cn("bg-primary h-full rounded-full")}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
