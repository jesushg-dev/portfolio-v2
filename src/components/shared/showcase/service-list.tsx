import { cn } from "@/lib/utils";

export interface ServiceListItem {
  id?: string;
  title: string;
  badge?: string;
  subtitle?: string;
}

export interface ServiceListProps {
  items: ServiceListItem[];
  className?: string;
  emptyLabel?: string;
}

export function ServiceList({
  items,
  className,
  emptyLabel,
}: ServiceListProps) {
  if (items.length === 0) {
    return emptyLabel ? (
      <p className="text-muted-foreground mt-4 text-sm">{emptyLabel}</p>
    ) : null;
  }

  return (
    <ul
      className={cn(
        "border-border/80 divide-border/80 list-none divide-y border-t border-b",
        className,
      )}
    >
      {items.map((item, idx) => (
        <li
          key={item.id ?? `${item.title}-${idx}`}
          className="flex items-center justify-between gap-4 py-5"
        >
          <div>
            <span className="text-foreground text-base font-normal sm:text-lg">
              {item.title}
            </span>
            {item.subtitle ? (
              <p className="text-muted-foreground mt-0.5 text-sm">
                {item.subtitle}
              </p>
            ) : null}
          </div>
          {item.badge ? (
            <span className="text-muted-foreground shrink-0 font-mono text-sm font-semibold tracking-wider uppercase">
              {item.badge}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
