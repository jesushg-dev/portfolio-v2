"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface SeriesOption {
  slug?: string;
  name: string;
  description?: string | null;
  count: number;
}

interface BlogSeriesPopoverProps {
  seriesList: SeriesOption[];
  activeSeries: string | null;
  onSelectSeries: (series: string | null) => void;
  locale?: string;
}

export function BlogSeriesPopover({
  seriesList,
  activeSeries,
  onSelectSeries,
}: BlogSeriesPopoverProps) {
  const t = useTranslations("main.blog");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) setQuery("");
      return !prev;
    });
  };

  const filteredSeries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seriesList;
    return seriesList.filter((s) => s.name.toLowerCase().includes(q));
  }, [seriesList, query]);

  const activeLabel = activeSeries ?? t("allSeries");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={handleToggle}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border px-3",
          "text-sm font-medium transition-colors focus-visible:outline-2",
          "focus-visible:outline-primary",
          activeSeries
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:border-primary/40",
        )}
      >
        <BookOpen className="text-primary size-4" aria-hidden="true" />
        <span className="max-w-40 truncate">{activeLabel}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "border-border bg-card shadow-ink/10 absolute left-0 z-30 mt-2",
            "w-[min(18rem,calc(100vw-3rem))] rounded-2xl border p-2 shadow-xl",
            "sm:right-0 sm:left-auto",
          )}
        >
          <div className="relative">
            <Search
              className={cn(
                "text-muted-foreground pointer-events-none absolute top-1/2",
                "left-2.5 size-3.5 -translate-y-1/2",
              )}
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchList")}
              aria-label={t("searchList")}
              className={cn(
                "border-border bg-muted/40 text-foreground h-9 w-full",
                "placeholder:text-muted-foreground rounded-lg border pr-3 pl-8 text-sm",
                "focus:border-primary focus:bg-card focus:outline-hidden",
                "focus:ring-primary/20 focus:ring-2",
              )}
            />
          </div>

          <ul
            id={listboxId}
            role="listbox"
            className="mt-2 max-h-64 space-y-0.5 overflow-y-auto"
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!activeSeries}
                onClick={() => {
                  onSelectSeries(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg",
                  "px-3 py-2 text-left text-sm transition-colors",
                  !activeSeries
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="truncate">{t("allSeries")}</span>
                {!activeSeries ? (
                  <Check className="text-primary size-4 shrink-0" />
                ) : null}
              </button>
            </li>

            {filteredSeries.map((item) => {
              const isSelected = activeSeries === item.name;
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectSeries(item.name);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3",
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}

            {filteredSeries.length === 0 ? (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                {t("noResults")}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
