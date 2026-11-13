"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, LayoutGrid, List, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { BlogSeriesPopover, type SeriesOption } from "./blog-series-popover";
import { BlogTopicsPopover, type TagCountItem } from "./blog-topics-popover";
import { cn } from "@/lib/utils";

const VISIBLE_TAGS_COUNT = 6;

export interface BlogToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeSeries: string | null;
  onSelectSeries: (series: string | null) => void;
  seriesList: SeriesOption[];
  sort: "new" | "old" | "part";
  onSortChange: (sort: "new" | "old" | "part") => void;
  viewMode: "feed" | "grid";
  onViewModeChange: (view: "feed" | "grid") => void;
  tagsWithCounts: TagCountItem[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  totalPostsCount: number;
  locale: string;
}

export function BlogToolbar({
  query,
  onQueryChange,
  activeSeries,
  onSelectSeries,
  seriesList,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  tagsWithCounts,
  activeTag,
  onSelectTag,
  totalPostsCount,
  locale,
}: BlogToolbarProps) {
  const t = useTranslations("main.blog");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && activeEl === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const topTags = tagsWithCounts.slice(0, VISIBLE_TAGS_COUNT);
  const activeTagItem = activeTag
    ? tagsWithCounts.find((item) => item.tag === activeTag)
    : null;
  const isExtraTag =
    Boolean(activeTag) && !topTags.some((item) => item.tag === activeTag);

  return (
    <section
      aria-label={t("filterPosts")}
      className={cn(
        "border-border bg-card/85 sticky top-20 z-20 mt-10 rounded-2xl",
        "border p-3 shadow-md backdrop-blur",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <label className="relative min-w-[12.5rem] flex-1">
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <Search
            className={cn(
              "text-muted-foreground pointer-events-none absolute top-1/2",
              "left-3 size-4 -translate-y-1/2",
            )}
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            id="blog-search-input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className={cn(
              "border-border bg-muted/40 text-foreground",
              "placeholder:text-muted-foreground focus:border-primary",
              "focus:bg-card focus:ring-2 focus:outline-hidden",
              "focus:ring-primary/20 h-10 w-full rounded-xl border",
              "pr-10 pl-9 text-sm transition-colors",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                searchInputRef.current?.focus();
              }}
              aria-label={t("clearSearch")}
              className={cn(
                "text-muted-foreground hover:text-foreground absolute top-1/2",
                "right-2.5 -translate-y-1/2 rounded p-1 transition-colors",
                "focus-visible:outline-primary focus-visible:outline-2",
              )}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <kbd
              className={cn(
                "border-border bg-card text-muted-foreground pointer-events-none",
                "absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border",
                "px-1.5 text-[0.6875rem] font-medium sm:block",
              )}
            >
              /
            </kbd>
          )}
        </label>

        {/* Series Selector Popover */}
        <BlogSeriesPopover
          seriesList={seriesList}
          activeSeries={activeSeries}
          onSelectSeries={onSelectSeries}
          locale={locale}
        />

        {/* Sort Select */}
        <label className="relative">
          <span className="sr-only">{t("sortPosts")}</span>
          <select
            value={sort}
            onChange={(e) =>
              onSortChange(e.target.value as "new" | "old" | "part")
            }
            className={cn(
              "border-border bg-card text-foreground focus:border-primary",
              "focus:ring-primary/20 h-10 focus:ring-2 focus:outline-hidden",
              "appearance-none rounded-xl border pr-8 pl-3 text-sm font-medium",
            )}
          >
            <option value="new">{t("sortNewest")}</option>
            <option value="old">{t("sortOldest")}</option>
            <option value="part" disabled={!activeSeries}>
              {t("sortOrder")}
            </option>
          </select>
          <ChevronDown
            className={cn(
              "text-muted-foreground pointer-events-none absolute top-1/2",
              "right-2.5 size-4 -translate-y-1/2",
            )}
            aria-hidden="true"
          />
        </label>

        {/* View Mode Toggle */}
        <div
          role="group"
          aria-label={t("layout")}
          className="border-border bg-muted/40 flex h-10 rounded-xl border p-0.5"
        >
          <button
            type="button"
            aria-pressed={viewMode === "feed"}
            onClick={() => onViewModeChange("feed")}
            className={cn(
              "flex items-center gap-1.5 rounded-[0.625rem] px-3 text-sm font-medium",
              "focus-visible:outline-primary transition-colors focus-visible:outline-2",
              viewMode === "feed"
                ? "bg-card text-primary font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-4" aria-hidden="true" />
            <span>{t("viewFeed")}</span>
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-[0.625rem] px-3 text-sm font-medium",
              "focus-visible:outline-primary transition-colors focus-visible:outline-2",
              viewMode === "grid"
                ? "bg-card text-primary font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            <span>{t("viewGrid")}</span>
          </button>
        </div>
      </div>

      {/* Tag Chips Row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label={t("filterByTag")} className="contents">
          {/* All Chip */}
          <button
            type="button"
            aria-pressed={!activeTag}
            onClick={() => onSelectTag(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
              "text-sm font-medium transition-colors focus-visible:outline-2",
              "focus-visible:outline-primary",
              !activeTag
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : cn(
                    "border-border bg-card text-muted-foreground",
                    "hover:border-primary/40 hover:text-foreground",
                  ),
            )}
          >
            <span>{t("allTags")}</span>
            <span
              className={cn(
                "text-xs",
                !activeTag
                  ? "text-primary-foreground/75"
                  : "text-muted-foreground",
              )}
            >
              {totalPostsCount}
            </span>
          </button>

          {/* Top Tag Chips */}
          {topTags.map((item) => {
            const isSelected = activeTag === item.tag;
            return (
              <button
                key={item.tag}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectTag(isSelected ? null : item.tag)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
                  "text-sm font-medium transition-colors focus-visible:outline-2",
                  "focus-visible:outline-primary",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : cn(
                        "border-border bg-card text-muted-foreground",
                        "hover:border-primary/40 hover:text-foreground",
                      ),
                )}
              >
                <span>#{item.tag}</span>
                <span
                  className={cn(
                    "text-xs",
                    isSelected
                      ? "text-primary-foreground/75"
                      : "text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}

          {/* Extra Tag Chip if not in top tags */}
          {isExtraTag && activeTagItem ? (
            <button
              type="button"
              aria-pressed={true}
              onClick={() => onSelectTag(null)}
              className={cn(
                "border-primary bg-primary text-primary-foreground inline-flex",
                "items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                "font-semibold transition-colors focus-visible:outline-2",
                "focus-visible:outline-primary",
              )}
            >
              <span>#{activeTagItem.tag}</span>
              <span className="text-primary-foreground/75 text-xs">
                {activeTagItem.count}
              </span>
            </button>
          ) : null}
        </div>

        {/* All Topics Popover */}
        <BlogTopicsPopover
          tags={tagsWithCounts}
          activeTag={activeTag}
          onSelectTag={onSelectTag}
        />
      </div>
    </section>
  );
}
