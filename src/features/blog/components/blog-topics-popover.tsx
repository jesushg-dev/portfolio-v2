"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface TagCountItem {
  tag: string;
  count: number;
}

interface BlogTopicsPopoverProps {
  tags: TagCountItem[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function BlogTopicsPopover({
  tags,
  activeTag,
  onSelectTag,
}: BlogTopicsPopoverProps) {
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

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((item) => item.tag.toLowerCase().includes(q));
  }, [tags, query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
          "text-primary text-sm font-semibold transition-colors",
          "hover:bg-primary/10 focus-visible:outline-primary focus-visible:outline-2",
        )}
      >
        <span>{t("allTopics")}</span>
        <span className="text-muted-foreground text-xs font-medium">
          {tags.length}
        </span>
      </button>

      {isOpen ? (
        <div
          className={cn(
            "border-border bg-card shadow-ink/10 absolute left-0 z-30 mt-2",
            "w-[min(18rem,calc(100vw-3rem))] rounded-2xl border p-2 shadow-xl",
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
            {filteredTags.map((item) => {
              const isSelected = activeTag === item.tag;
              return (
                <li key={item.tag}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectTag(isSelected ? null : item.tag);
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
                    <span className="truncate">#{item.tag}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">
                        {item.count}
                      </span>
                      {isSelected ? (
                        <Check className="text-primary size-3.5" />
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}

            {filteredTags.length === 0 ? (
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
