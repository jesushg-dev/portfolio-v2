"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Search,
  X,
  Eye,
  Monitor,
  Server,
  Smartphone,
  Laptop,
} from "lucide-react";
import { motion } from "motion/react";

import { Link } from "@/i18n/routing";
import type { ProjectType } from "@/utils/interfaces/types";
import PortfolioItem from "@/features/home/components/portfolio/project-item";
import SkillIcon from "@/features/home/components/skills/skill-icon";

const PAGE_SIZE = 6;
const TYPES = ["All", "FRONTEND", "BACKEND", "MOBILE", "DESKTOP"] as const;

type ProjectTypeFilter = (typeof TYPES)[number];
type ProjectKindFilter = "ALL" | "PROFESSIONAL" | "PERSONAL" | "LEARNING";
type SortOption = "default" | "name" | "cs";

interface ProjectsCatalogViewProps {
  initialProjects: ProjectType[];
}

interface TypeSegmentButtonsProps {
  currentType: ProjectTypeFilter;
  counts: Record<ProjectTypeFilter, number>;
  onSelect: (type: ProjectTypeFilter) => void;
  typeLabels: Record<ProjectTypeFilter, string>;
}

export function TypeSegmentButtons({
  currentType,
  counts,
  onSelect,
  typeLabels,
}: TypeSegmentButtonsProps) {
  const icons: Record<ProjectTypeFilter, typeof Eye> = {
    All: Eye,
    FRONTEND: Monitor,
    BACKEND: Server,
    MOBILE: Smartphone,
    DESKTOP: Laptop,
  };

  return (
    <div
      role="group"
      aria-label="Filter by project type"
      className="border-border bg-muted/70 flex flex-wrap justify-center gap-1 rounded-3xl border p-1.5 md:rounded-full"
    >
      {TYPES.map((t) => {
        const IconComponent = icons[t];
        const isSelected = currentType === t;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(t)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all md:px-5 md:py-2.5 md:text-sm ${
              isSelected
                ? "bg-card text-foreground border-border/80 border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconComponent className="size-4 shrink-0" aria-hidden="true" />
            <span>{typeLabels[t]}</span>
            <span className="text-muted-foreground text-xs opacity-75">
              {counts[t]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface KindChipsProps {
  currentKind: ProjectKindFilter;
  onSelect: (kind: ProjectKindFilter) => void;
  kindLabels: Record<ProjectKindFilter, string>;
}

export function KindChips({
  currentKind,
  onSelect,
  kindLabels,
}: KindChipsProps) {
  const kinds: ProjectKindFilter[] = [
    "ALL",
    "PROFESSIONAL",
    "PERSONAL",
    "LEARNING",
  ];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="flex flex-wrap gap-2"
    >
      {kinds.map((k) => {
        const isSelected = currentKind === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(k)}
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {kindLabels[k]}
          </button>
        );
      })}
    </div>
  );
}

interface TechChipsProps {
  topTech: { name: string; count: number; image?: string | null }[];
  selectedTech: Set<string>;
  onToggle: (tech: string) => void;
}

export function TechChips({ topTech, selectedTech, onToggle }: TechChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by technology"
      className="flex flex-wrap gap-2"
    >
      {topTech.map(({ name, count, image }) => {
        const isSelected = selectedTech.has(name);
        return (
          <button
            key={name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(name)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <SkillIcon
              image={image}
              title={name}
              tile
              size="sm"
              className="size-4.5 rounded-sm text-[9px]"
            />
            <span>{name}</span>
            <span
              className={`text-[11px] font-bold ${
                isSelected ? "text-primary-foreground/90" : "text-primary"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface CatalogEmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onClear: () => void;
}

export function CatalogEmptyState({
  title,
  description,
  buttonText,
  onClear,
}: CatalogEmptyStateProps) {
  return (
    <div className="border-border bg-card/60 flex flex-col items-center justify-center rounded-[2rem] border border-dashed py-16 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
        <Search className="size-7" aria-hidden="true" />
      </span>
      <p className="text-foreground mt-5 text-lg font-bold">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        {description}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-full px-6 py-2.5 text-xs font-bold transition-all"
      >
        {buttonText}
      </button>
    </div>
  );
}

function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getInitialUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function ProjectsCatalogView({
  initialProjects,
}: ProjectsCatalogViewProps) {
  const t = useTranslations("main.portfolio");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort states initialized lazily from URL
  const [query, setQuery] = useState(() => getInitialUrlParam("q") ?? "");
  const [selectedType, setSelectedType] = useState<ProjectTypeFilter>(() => {
    const typeParam = getInitialUrlParam("type");
    return typeParam && (TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as ProjectTypeFilter)
      : "All";
  });
  const [selectedKind, setSelectedKind] = useState<ProjectKindFilter>(() => {
    const kindParam = getInitialUrlParam("kind");
    return kindParam &&
      ["ALL", "PROFESSIONAL", "PERSONAL", "LEARNING"].includes(kindParam)
      ? (kindParam as ProjectKindFilter)
      : "ALL";
  });
  const [selectedTech, setSelectedTech] = useState<Set<string>>(() => {
    const techParam = getInitialUrlParam("tech");
    if (!techParam) return new Set();
    return new Set(
      techParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
  });
  const [csOnly, setCsOnly] = useState(
    () => getInitialUrlParam("cs") === "1",
  );
  const [sort, setSort] = useState<SortOption>(() => {
    const sortParam = getInitialUrlParam("sort");
    return sortParam && ["default", "name", "cs"].includes(sortParam)
      ? (sortParam as SortOption)
      : "default";
  });
  const [shownCount, setShownCount] = useState(PAGE_SIZE);

  // Update URL search params when state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (selectedType !== "All") urlParams.set("type", selectedType);
    if (selectedKind !== "ALL") urlParams.set("kind", selectedKind);
    if (selectedTech.size > 0)
      urlParams.set("tech", Array.from(selectedTech).join(","));
    if (csOnly) urlParams.set("cs", "1");
    if (sort !== "default") urlParams.set("sort", sort);

    const searchString = urlParams.toString();
    const newUrl = searchString
      ? `${window.location.pathname}?${searchString}`
      : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  }, [query, selectedType, selectedKind, selectedTech, csOnly, sort]);

  // Keyboard shortcut '/' to search, 'Esc' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(
          (document.activeElement as HTMLElement)?.tagName || "",
        )
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current &&
        query
      ) {
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  // Compute top technologies from initial projects
  const topTech = useMemo(() => {
    const techMap = new Map<string, { count: number; image?: string | null }>();
    for (const project of initialProjects) {
      if (!project.skills) continue;
      for (const skill of project.skills) {
        const existing = techMap.get(skill.title);
        if (existing) {
          existing.count += 1;
        } else {
          techMap.set(skill.title, { count: 1, image: skill.image });
        }
      }
    }
    return Array.from(techMap.entries())
      .map(([name, data]) => ({ name, count: data.count, image: data.image }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [initialProjects]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    const normQuery = normalizeSearch(query.trim());

    const result = initialProjects.filter((project) => {
      if (selectedType !== "All" && project.type !== selectedType) {
        return false;
      }
      if (
        selectedKind !== "ALL" &&
        (project.kind ?? "PERSONAL") !== selectedKind
      ) {
        return false;
      }
      if (csOnly && !project.caseStudyEnabled) {
        return false;
      }
      if (selectedTech.size > 0) {
        const projectTechNames = new Set(
          project.skills?.map((s) => s.title) ?? [],
        );
        for (const t of selectedTech) {
          if (!projectTechNames.has(t)) return false;
        }
      }
      if (normQuery) {
        const searchable = normalizeSearch(
          [
            project.title,
            project.description,
            project.hook ?? "",
            ...(project.skills?.map((s) => s.title) ?? []),
          ].join(" "),
        );
        if (!searchable.includes(normQuery)) return false;
      }
      return true;
    });

    if (sort === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "cs") {
      result.sort((a, b) => {
        const aCs = a.caseStudyEnabled ? 1 : 0;
        const bCs = b.caseStudyEnabled ? 1 : 0;
        return bCs - aCs || (a.order ?? 999) - (b.order ?? 999);
      });
    }

    return result;
  }, [
    initialProjects,
    query,
    selectedType,
    selectedKind,
    selectedTech,
    csOnly,
    sort,
  ]);

  // Counts for type segmented buttons reflecting current non-type filters
  const typeCounts = useMemo(() => {
    const normQuery = normalizeSearch(query.trim());
    const countForType = (typeFilter: ProjectTypeFilter) => {
      return initialProjects.filter((project) => {
        if (typeFilter !== "All" && project.type !== typeFilter) return false;
        if (
          selectedKind !== "ALL" &&
          (project.kind ?? "PERSONAL") !== selectedKind
        )
          return false;
        if (csOnly && !project.caseStudyEnabled) return false;
        if (selectedTech.size > 0) {
          const projectTechNames = new Set(
            project.skills?.map((s) => s.title) ?? [],
          );
          for (const t of selectedTech) {
            if (!projectTechNames.has(t)) return false;
          }
        }
        if (normQuery) {
          const searchable = normalizeSearch(
            [
              project.title,
              project.description,
              project.hook ?? "",
              ...(project.skills?.map((s) => s.title) ?? []),
            ].join(" "),
          );
          if (!searchable.includes(normQuery)) return false;
        }
        return true;
      }).length;
    };

    return {
      All: countForType("All"),
      FRONTEND: countForType("FRONTEND"),
      BACKEND: countForType("BACKEND"),
      MOBILE: countForType("MOBILE"),
      DESKTOP: countForType("DESKTOP"),
    };
  }, [initialProjects, query, selectedKind, selectedTech, csOnly]);

  const hasActiveFilters = Boolean(
    query ||
    selectedType !== "All" ||
    selectedKind !== "ALL" ||
    selectedTech.size > 0 ||
    csOnly ||
    sort !== "default",
  );

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setSelectedType("All");
    setSelectedKind("ALL");
    setSelectedTech(new Set());
    setCsOnly(false);
    setSort("default");
    setShownCount(PAGE_SIZE);
  }, []);

  const handleToggleTech = useCallback((tech: string) => {
    setSelectedTech((prev) => {
      const next = new Set(prev);
      if (next.has(tech)) {
        next.delete(tech);
      } else {
        next.add(tech);
      }
      return next;
    });
  }, []);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleTypeSelect = useCallback((t: ProjectTypeFilter) => {
    setSelectedType(t);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleKindSelect = useCallback((k: ProjectKindFilter) => {
    setSelectedKind(k);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleSortChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortOption);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setShownCount((prev) => prev + PAGE_SIZE);
  }, []);

  const labels = useMemo(
    () => ({
      urlName: t("actions.view"),
      sourceName: t("actions.source"),
      caseStudyLabel: t("actions.caseStudy"),
      privateName: t("private.title"),
      privateDescription: t("private.description"),
      canSeeDemo: t("private.canSeeDemo"),
      kindLabels: {
        PROFESSIONAL: t("kind.PROFESSIONAL"),
        PERSONAL: t("kind.PERSONAL"),
        LEARNING: t("kind.LEARNING"),
      },
      metaLabels: {
        solo: t("meta.solo"),
        formatTeam: (count: number) => t("meta.team", { count }),
        now: t("meta.now"),
        statuses: {
          IN_PRODUCTION: t("caseStudy.statuses.IN_PRODUCTION"),
          MAINTENANCE: t("caseStudy.statuses.MAINTENANCE"),
          ARCHIVED: t("caseStudy.statuses.ARCHIVED"),
        },
      },
      teaserLabels: {
        formatDecisions: (count: number) => t("teaser.decisions", { count }),
        layers: t("teaser.layers"),
        formatMetrics: (count: number) => t("teaser.metrics", { count }),
      },
    }),
    [t],
  );

  const typeLabels: Record<ProjectTypeFilter, string> = useMemo(
    () => ({
      All: t("filters.all"),
      FRONTEND: t("filters.frontend"),
      BACKEND: t("filters.backend"),
      MOBILE: t("filters.mobile"),
      DESKTOP: t("filters.desktop"),
    }),
    [t],
  );

  const kindLabels: Record<ProjectKindFilter, string> = useMemo(
    () => ({
      ALL: t("filters.all"),
      PROFESSIONAL: t("kind.PROFESSIONAL"),
      PERSONAL: t("kind.PERSONAL"),
      LEARNING: t("kind.LEARNING"),
    }),
    [t],
  );

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, shownCount);
  }, [filteredProjects, shownCount]);

  const remainingCount = filteredProjects.length - visibleProjects.length;

  return (
    <section
      aria-label={t("catalog.pageTitle")}
      className="mx-auto w-full px-4 pt-24 pb-20 sm:px-6 sm:pt-28 lg:container lg:px-20"
    >
      {/* Back to portfolio */}
      <Link
        href="/"
        className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{t("catalog.backToPortfolio")}</span>
      </Link>

      {/* Hero Header */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-sm font-semibold tracking-wider uppercase">
          {t("subtitle")}
        </p>
        <h1 className="text-foreground mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
          {t("catalog.pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed md:text-lg">
          {t("catalog.pageSubtitle")}
        </p>
      </div>

      {/* Type Segment Control */}
      <div className="mt-10 flex justify-center">
        <TypeSegmentButtons
          currentType={selectedType}
          counts={typeCounts}
          onSelect={handleTypeSelect}
          typeLabels={typeLabels}
        />
      </div>

      {/* Filter Bar */}
      <div className="border-border bg-card/70 mt-8 rounded-[2rem] border p-4 shadow-xs backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{t("catalog.searchLabel")}</span>
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={handleSearchChange}
              placeholder={t("catalog.searchPlaceholder")}
              autoComplete="off"
              className="border-border bg-background focus:border-primary text-foreground placeholder:text-muted-foreground focus:ring-primary/10 w-full rounded-2xl border py-3 pr-12 pl-11 text-sm transition outline-none focus:ring-4"
            />
            <kbd className="border-border text-muted-foreground pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded border px-1.5 text-xs md:block">
              /
            </kbd>
          </label>

          <label className="md:w-60">
            <span className="sr-only">{t("catalog.sortLabel")}</span>
            <select
              value={sort}
              onChange={handleSortChange}
              className="border-border bg-background focus:border-primary text-foreground focus:ring-primary/10 w-full cursor-pointer rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-4"
            >
              <option value="default">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.default")}`}</option>
              <option value="name">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.name")}`}</option>
              <option value="cs">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.cs")}`}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
              {t("catalog.kindLabel")}
            </p>
            <KindChips
              currentKind={selectedKind}
              onSelect={handleKindSelect}
              kindLabels={kindLabels}
            />
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
              {t("catalog.techLabel")}
            </p>
            <TechChips
              topTech={topTech}
              selectedTech={selectedTech}
              onToggle={handleToggleTech}
            />
          </div>
        </div>
      </div>

      {/* Filter Status Bar */}
      <div className="text-muted-foreground mt-5 flex min-h-8 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-sm">
        <p role="status" aria-live="polite">
          {t("catalog.showing", {
            count: filteredProjects.length,
            total: initialProjects.length,
          })}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            role="switch"
            aria-checked={csOnly}
            onClick={() => setCsOnly((prev) => !prev)}
            className="flex cursor-pointer items-center gap-3 rounded-full py-1 text-sm font-medium"
          >
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                csOnly ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-hidden="true"
            >
              <i
                className={`bg-card absolute top-0.5 left-0.5 block size-5 rounded-full shadow-xs transition-transform ${
                  csOnly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
            <span>{t("catalog.csOnly")}</span>
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1.5 font-semibold transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
              <span>{t("catalog.clearFilters")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {visibleProjects.length === 0 ? (
        <div className="mt-8">
          <CatalogEmptyState
            title={t("catalog.emptyTitle")}
            description={t("catalog.emptyDescription")}
            buttonText={t("catalog.emptyButton")}
            onClear={handleClearFilters}
          />
        </div>
      ) : (
        <motion.ul
          layout
          className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {visibleProjects.map((project, idx) => (
            <motion.li
              layout
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.04 }}
              className="flex justify-center"
            >
              <PortfolioItem {...project} {...labels} priority={idx < 3} />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Pagination "Ver más" */}
      {remainingCount > 0 ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="border-border bg-card text-foreground hover:border-primary/50 hover:text-primary rounded-full border px-7 py-3 text-sm font-bold shadow-xs transition-colors"
          >
            {t("catalog.more", { count: remainingCount })}
          </button>
        </div>
      ) : null}
    </section>
  );
}
