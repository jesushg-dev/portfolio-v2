import { cn } from "@/lib/utils";

export interface MetricItem {
  label: string;
  value: string | number;
  helper?: string;
}

export interface MetricGridProps {
  items: MetricItem[];
  columns?: 2 | 3 | 4;
  size?: "default" | "sm" | "mini";
  align?: "left" | "center";
  className?: string;
}

export function MetricGrid({
  items,
  columns = 3,
  size = "default",
  align = "left",
  className,
}: MetricGridProps) {
  const columnClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8"
        : "grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-10";

  const valueSizeClass =
    size === "mini"
      ? "text-2xl sm:text-3xl font-semibold"
      : size === "sm"
        ? "text-3xl sm:text-4xl lg:text-5xl font-semibold"
        : "text-4xl sm:text-5xl lg:text-6xl font-semibold";

  const isCenter = align === "center";

  return (
    <div className={cn("grid", columnClass, className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "border-border/80 border-t pt-5",
            isCenter && "text-center",
          )}
        >
          <p
            className={cn(
              "text-foreground leading-none tracking-tight tabular-nums",
              valueSizeClass,
            )}
          >
            {item.value}
          </p>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            {item.label}
          </p>
          {item.helper ? (
            <p className="text-muted-foreground/80 mt-1 font-mono text-xs">
              {item.helper}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
