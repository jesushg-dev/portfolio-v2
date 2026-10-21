"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type FC,
} from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { TimelineCategory } from "@prisma/client";
import { motion } from "motion/react";

import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";
import {
  TimelineFilterTabs,
  type TimelineFilter,
} from "./timeline-filter-tabs";
import { TimelineStage } from "./timeline-stage";
import { TimelineItemCard } from "./timeline-item-card";

export interface TimelineViewProps {
  items: TimelinePublicItem[];
}

export const TimelineView: FC<TimelineViewProps> = ({ items }) => {
  const t = useTranslations("main.timeline");

  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [progressHeight, setProgressHeight] = useState(0);

  const listRef = useRef<HTMLOListElement>(null);

  // Compute filter counts
  const counts = useMemo(() => {
    return {
      all: items.length,
      work: items.filter((e) => e.category === "WORK").length,
      learning: items.filter(
        (e) => e.category === "STUDY" || e.category === "COURSE",
      ).length,
    };
  }, [items]);

  // Compute filtered items
  const filteredItems = useMemo(() => {
    if (filter === "work") {
      return items.filter((e) => e.category === "WORK");
    }
    if (filter === "learning") {
      return items.filter(
        (e) => e.category === "STUDY" || e.category === "COURSE",
      );
    }
    return items;
  }, [items, filter]);

  const handleFilterSelect = useCallback((nextFilter: TimelineFilter) => {
    setFilter(nextFilter);
    setActiveIndex(0);
    setActiveImageIndex(0);
  }, []);

  const handleActiveIndex = useCallback((index: number) => {
    setActiveIndex(index);
    setActiveImageIndex(0);
  }, []);

  const handleSelectImage = useCallback((index: number) => {
    setActiveImageIndex(index);
  }, []);

  // Calculate timeline line scroll progress
  useEffect(() => {
    const updateProgress = () => {
      const ol = listRef.current;
      if (!ol) return;
      const rect = ol.getBoundingClientRect();
      const viewportHalf = window.innerHeight * 0.5;
      const targetHeight = viewportHalf - rect.top - 24;
      const maxHeight = Math.max(0, rect.height - 48);
      const clamped = Math.max(0, Math.min(maxHeight, targetHeight));
      setProgressHeight(clamped);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [filteredItems.length]);

  // Compute overall stats (Since {minYear} · {totalMilestones} milestones · {uniqueWorkplaces} workplaces)
  const statsString = useMemo(() => {
    if (items.length === 0) return "";
    const years = items
      .map((e) => new Date(e.startDate).getFullYear())
      .filter((y) => !Number.isNaN(y));
    const minYear =
      years.length > 0 ? Math.min(...years) : new Date().getFullYear();
    const workItems = items.filter((e) => e.category === "WORK");
    const uniqueWorkplaces = new Set(
      workItems.map((e) => e.organization.trim()),
    ).size;

    return t("stats", {
      year: minYear,
      milestones: items.length,
      workplaces: uniqueWorkplaces,
    });
  }, [items, t]);

  const categoryLabels: Record<TimelineCategory, string> = useMemo(
    () => ({
      WORK: t("categories.WORK"),
      STUDY: t("categories.STUDY"),
      COURSE: t("categories.COURSE"),
    }),
    [t],
  );

  const filterTabLabels = useMemo(
    () => ({
      all: t("filters.all"),
      work: t("filters.work"),
      learning: t("filters.learning"),
      ariaLabel: t("filters.ariaLabel"),
    }),
    [t],
  );

  const activeItem = filteredItems[activeIndex] ?? filteredItems[0];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header with Title and Stats (Left aligned as in prototype) */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-primary text-base font-semibold md:text-lg">
            {t("subtitle")}
          </p>
          <h1 className="text-foreground mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t("title")}
          </h1>
        </div>
        {statsString ? (
          <p className="text-muted-foreground text-sm font-medium md:text-right">
            {statsString}
          </p>
        ) : null}
      </header>

      {/* Filter Tabs */}
      <div className="mt-8">
        <TimelineFilterTabs
          currentFilter={filter}
          counts={counts}
          onSelect={handleFilterSelect}
          labels={filterTabLabels}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-base">{t("emptyFilter")}</p>
        </div>
      ) : (
        /* 2-Column Responsive Layout */
        <div className="mt-10 grid gap-x-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Desktop Sticky Visual Stage */}
          <TimelineStage
            activeItem={activeItem}
            activeImageIndex={activeImageIndex}
            onSelectImage={handleSelectImage}
            categoryLabels={categoryLabels}
            imageOfLabel={(curr, total) =>
              t("imageOf", { current: curr, total })
            }
            presentLabel={t("present")}
          />

          {/* Right Column: Scrollable Timeline Stream */}
          <motion.ol
            ref={listRef}
            layout
            className="border-border/60 before:bg-border/60 relative ml-2 before:absolute before:top-6 before:bottom-6 before:left-0 before:w-0.5"
          >
            {/* Animated progress fill bar with spring physics */}
            <motion.span
              className="bg-primary pointer-events-none absolute top-6 left-0 w-0.5 rounded-full"
              animate={{ height: progressHeight }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 35,
              }}
              aria-hidden="true"
            />

            {filteredItems.map((item, idx) => {
              const currentYear = new Date(item.startDate).getFullYear();
              const prevItem = filteredItems[idx - 1];
              const prevYear = prevItem
                ? new Date(prevItem.startDate).getFullYear()
                : null;
              const showYear = currentYear !== prevYear;

              return (
                <TimelineItemCard
                  key={item.id}
                  item={item}
                  index={idx}
                  isActive={idx === activeIndex}
                  showYear={showYear}
                  year={currentYear}
                  categoryLabels={categoryLabels}
                  rolesLabel={t("roles")}
                  presentLabel={t("present")}
                  techAria={t("techAria")}
                  onIntersect={handleActiveIndex}
                />
              );
            })}
          </motion.ol>
        </div>
      )}

      {/* Footer CTA & Curriculum Vitae link */}
      <footer className="mt-16 text-center">
        <p className="text-muted-foreground text-sm">
          {filter === "all"
            ? t("showingAll")
            : t("showingFiltered", { count: filteredItems.length })}
        </p>
        <div className="mt-3 flex justify-center">
          <Link
            href="/curriculum-vitae"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <span>{t("viewCv")}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </div>
  );
};
