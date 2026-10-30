"use client";

import type { FC, KeyboardEvent } from "react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedNavItem } from "./nav-item-resolver";

interface MegaMenuItemListProps {
  items: ResolvedNavItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onNavigate: () => void;
}

export const MegaMenuItemList: FC<MegaMenuItemListProps> = ({
  items,
  selectedIndex,
  onSelectIndex,
  onNavigate,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelectIndex((index + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelectIndex((index - 1 + items.length) % items.length);
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      className="border-border/50 flex w-full shrink-0 flex-col gap-1 p-3 lg:w-80 lg:border-r"
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === selectedIndex;

        const content = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "bg-primary absolute top-1/2 left-0 w-0.75 -translate-y-1/2 rounded-r-full transition-all duration-200",
                isActive ? "h-6 opacity-100" : "h-0 opacity-0",
              )}
            />
            <span
              className={cn(
                "flex size-9.5 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-primary/10 text-primary group-hover:bg-primary/15",
              )}
            >
              <Icon aria-hidden="true" className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-foreground block text-sm leading-snug font-semibold">
                  {item.label}
                </span>
                {item.comingSoon ? (
                  <Badge
                    variant="secondary"
                    className="h-4.5 px-1.5 text-[0.625rem]"
                  >
                    Soon
                  </Badge>
                ) : null}
              </span>
              <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                {item.short}
              </span>
            </span>
          </>
        );

        const sharedClassName = cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-all outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          isActive
            ? "bg-accent/60 text-foreground"
            : "text-muted-foreground hover:bg-accent/35 hover:text-foreground",
        );

        if (item.comingSoon) {
          return (
            <div
              key={item.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onMouseEnter={() => onSelectIndex(index)}
              onFocus={() => onSelectIndex(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(sharedClassName, "cursor-default opacity-75")}
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            role="tab"
            aria-selected={isActive}
            href={item.href}
            onNavigate={onNavigate}
            onMouseEnter={() => onSelectIndex(index)}
            onFocus={() => onSelectIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={sharedClassName}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
};

export default MegaMenuItemList;
