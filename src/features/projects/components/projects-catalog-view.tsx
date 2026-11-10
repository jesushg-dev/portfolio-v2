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
  ArrowRight,
  Search,
  X,
  Eye,
  Monitor,
  Server,
  Smartphone,
  Laptop,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import type { ProjectType } from "@/utils/interfaces/types";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import { MediaImage } from "@/components/shared/media-image";
import { GithubIcon } from "@/components/shared/brand-icons";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { ProjectCatalogItem, getProjectInitials } from "./project-catalog-item";

const PAGE_SIZE = 6;
const TYPES = ["All", "FRONTEND", "BACKEND", "MOBILE", "DESKTOP"] as const;

type ProjectTypeFilter = (typeof TYPES)[number];
type ProjectKindFilter = "ALL" | "PROFESSIONAL" | "PERSONAL" | "LEARNING";
type SortOption = "default" | "name" | "cs";

interface ProjectsCatalogViewProps {
  initialProjects: ProjectType[];
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

interface TypeSegmentButtonsProps {
  currentType: ProjectTypeFilter;
  counts: Record<ProjectTypeFilter, number>;
  onSelect: (type: ProjectTypeFilter) => void;
  typeLabels: Record<ProjectTypeFilter, string>;
  ariaLabel: string;
}

export function TypeSegmentButtons({
  currentType,
  counts,
  onSelect,
  typeLabels,
  ariaLabel,
}: TypeSegmentButtonsProps) {
  const currentIndex = Math.max(0, TYPES.indexOf(currentType));

  const handleTabChange = useCallback(
    (index: number) => {
      const selected = TYPES[index] ?? "All";
      onSelect(selected);
    },
    [onSelect],
  );

  return (
    <div className="flex w-full justify-center px-2 sm:px-4">
      <Tab
        tabId="projects-catalog-tab"
        currentTab={currentIndex}
        setCurrentTab={handleTabChange}
        ariaLabel={ariaLabel}
        className="max-w-full"
      >
        <TabItem icon={Eye} title={typeLabels.All} count={counts.All} />
        <TabItem
          icon={Monitor}
          title={typeLabels.FRONTEND}
          count={counts.FRONTEND}
        />
        <TabItem
          icon={Server}
          title={typeLabels.BACKEND}
          count={counts.BACKEND}
        />
        <TabItem
          icon={Smartphone}
          title={typeLabels.MOBILE}
          count={counts.MOBILE}
        />
        <TabItem
          icon={Laptop}
          title={typeLabels.DESKTOP}
          count={counts.DESKTOP}
        />
      </Tab>
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
      className="flex flex-wrap justify-center gap-2"
    >
      {kinds.map((k) => {
        const isSelected = currentKind === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(k)}
            className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 py-1 text-xs font-medium transition-colors sm:text-sm ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border/80 text-muted-foreground hover:text-foreground bg-transparent"
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
      className="flex flex-wrap justify-center gap-2"
    >
      {topTech.map(({ name, count, image }) => {
        const isSelected = selectedTech.has(name);
        return (
          <button
            key={name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(name)}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium transition-colors sm:text-sm ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border/80 text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            <SkillIcon
              image={image}
              title={name}
              tile
              size="sm"
              className="size-4 rounded-xs text-[0.625rem]"
            />
            <span>{name}</span>
            <span className="text-xs opacity-70">({count})</span>
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
    <div className="border-border/80 bg-card/40 flex flex-col items-center justify-center rounded-3xl border border-dashed py-16 text-center">
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
        className="bg-primary text-primary-foreground mt-6 cursor-pointer rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:brightness-110"
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

function getInitialUrlParam(
  key: string,
  initialSearchParams?: Record<string, string | string[] | undefined>,
): string | null {
  if (initialSearchParams) {
    const val = initialSearchParams[key];
    if (Array.isArray(val)) return val[0] ?? null;
    return typeof val === "string" ? val : null;
  }
  return null;
}

const KIND_KEYS = ["PROFESSIONAL", "PERSONAL", "LEARNING"] as const;
type PortfolioKindKey = (typeof KIND_KEYS)[number];
const isPortfolioKindKey = (k: unknown): k is PortfolioKindKey =>
  typeof k === "string" && KIND_KEYS.includes(k as PortfolioKindKey);

const STATUS_KEYS = ["IN_PRODUCTION", "MAINTENANCE", "ARCHIVED"] as const;
type PortfolioStatusKey = (typeof STATUS_KEYS)[number];
const isPortfolioStatusKey = (s: unknown): s is PortfolioStatusKey =>
  typeof s === "string" && STATUS_KEYS.includes(s as PortfolioStatusKey);

export function ProjectsCatalogView({
  initialProjects,
  initialSearchParams,
}: ProjectsCatalogViewProps) {
  const t = useTranslations("main.portfolio");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active preview project index in modal dialog
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(
    null,
  );

  // Filter and sort states initialized lazily from initialSearchParams or URL
  const [query, setQuery] = useState(
    () => getInitialUrlParam("q", initialSearchParams) ?? "",
  );
  const [selectedType, setSelectedType] = useState<ProjectTypeFilter>(() => {
    const typeParam = getInitialUrlParam("type", initialSearchParams);
    return typeParam && (TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as ProjectTypeFilter)
      : "All";
  });
  const [selectedKind, setSelectedKind] = useState<ProjectKindFilter>(() => {
    const kindParam = getInitialUrlParam("kind", initialSearchParams);
    return kindParam &&
      ["ALL", "PROFESSIONAL", "PERSONAL", "LEARNING"].includes(kindParam)
      ? (kindParam as ProjectKindFilter)
      : "ALL";
  });
  const [selectedTech, setSelectedTech] = useState<Set<string>>(() => {
    const techParam = getInitialUrlParam("tech", initialSearchParams);
    if (!techParam) return new Set();
    return new Set(
      techParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
  });
  const [csOnly, setCsOnly] = useState(
    () => getInitialUrlParam("cs", initialSearchParams) === "1",
  );
  const [sort, setSort] = useState<SortOption>(() => {
    const sortParam = getInitialUrlParam("sort", initialSearchParams);
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

  const getProjectMetaText = useCallback(
    (project: ProjectType) => {
      const parts: string[] = [];

      const kindStr =
        project.kind && isPortfolioKindKey(project.kind)
          ? t(`kind.${project.kind}`)
          : project.kind || "";
      if (kindStr) parts.push(kindStr);

      if (typeof project.teamSize === "number" && project.teamSize > 0) {
        parts.push(
          project.teamSize === 1
            ? t("meta.solo")
            : t("meta.team", { count: project.teamSize }),
        );
      }

      if (project.startedAt) {
        const startYear = project.startedAt.slice(0, 4);
        if (project.endedAt) {
          const endYear = project.endedAt.slice(0, 4);
          parts.push(
            startYear === endYear ? startYear : `${startYear}–${endYear}`,
          );
        } else {
          parts.push(`${startYear}–${t("meta.now")}`);
        }
      }

      if (project.status && isPortfolioStatusKey(project.status)) {
        try {
          const statusText = t(`caseStudy.statuses.${project.status}`);
          if (statusText) parts.push(statusText);
        } catch {
          // fallback if missing
        }
      }

      return parts.join(" · ");
    },
    [t],
  );

  const getImpactText = useCallback(
    (project: ProjectType) => {
      const parts: string[] = [];
      if (project.csInfo?.decisions) {
        parts.push(t("teaser.decisions", { count: project.csInfo.decisions }));
      }
      if (project.csInfo?.layers) {
        parts.push(t("teaser.layers"));
      }
      if (project.csInfo?.metrics) {
        parts.push(t("teaser.metrics", { count: project.csInfo.metrics }));
      }
      return parts.join(" · ");
    },
    [t],
  );

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, shownCount);
  }, [filteredProjects, shownCount]);

  const remainingCount = filteredProjects.length - visibleProjects.length;

  const activeProject =
    activePreviewIndex !== null
      ? (filteredProjects[activePreviewIndex] ?? null)
      : null;

  const handlePrev = useCallback(() => {
    setActivePreviewIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + filteredProjects.length) % filteredProjects.length;
    });
  }, [filteredProjects.length]);

  const handleNext = useCallback(() => {
    setActivePreviewIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % filteredProjects.length;
    });
  }, [filteredProjects.length]);

  const handleClose = useCallback(() => {
    setActivePreviewIndex(null);
  }, []);

  // Keyboard navigation when modal is open
  useEffect(() => {
    if (activePreviewIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePreviewIndex, handleClose, handleNext, handlePrev]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] pt-28 pb-16 text-center">
        <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("catalog.backToPortfolio")}</span>
          </Link>

          <p className="text-primary mb-3 text-sm font-medium tracking-normal">
            {t("subtitle")}
          </p>
          <h1 className="text-foreground mx-auto max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("catalog.pageTitle")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t("catalog.pageSubtitle")}
          </p>

          {/* Type Segment Control */}
          <div className="mt-10 flex justify-center">
            <TypeSegmentButtons
              currentType={selectedType}
              counts={typeCounts}
              onSelect={handleTypeSelect}
              typeLabels={typeLabels}
              ariaLabel={t("filters.ariaLabel")}
            />
          </div>

          {/* Search & Sort Bar (.bar2) */}
          <div className="mx-auto mt-7 flex max-w-2xl flex-col items-center gap-3 sm:flex-row">
            <label className="relative w-full flex-1">
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
                className="border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-full border py-3 pr-11 pl-11 text-sm outline-hidden transition-all focus:ring-2"
              />
              <kbd className="border-border text-muted-foreground pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-xs sm:block">
                /
              </kbd>
            </label>

            <label className="relative block w-full sm:w-56">
              <span className="sr-only">{t("catalog.sortLabel")}</span>
              <select
                value={sort}
                onChange={handleSortChange}
                className="border-border/80 bg-background/80 text-foreground focus:border-primary focus:ring-primary/20 w-full cursor-pointer appearance-none rounded-full border py-3 pr-10 pl-5 text-sm outline-hidden transition-all focus:ring-2"
              >
                <option value="default">{t("catalog.sorts.default")}</option>
                <option value="name">{t("catalog.sorts.name")}</option>
                <option value="cs">{t("catalog.sorts.cs")}</option>
              </select>
              <ChevronDown
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-4.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
            </label>
          </div>

          {/* Collapsible More Filters */}
          <details className="group mx-auto mt-3 max-w-2xl text-center">
            <summary className="text-primary inline-flex cursor-pointer list-none items-center gap-1.5 py-2 text-sm font-medium select-none hover:underline">
              <span>{t("catalog.moreFilters")}</span>
            </summary>
            <div className="border-border/60 mt-4 space-y-5 border-t pt-4">
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {t("catalog.kindLabel")}
                </p>
                <KindChips
                  currentKind={selectedKind}
                  onSelect={handleKindSelect}
                  kindLabels={kindLabels}
                />
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {t("catalog.techLabel")}
                </p>
                <TechChips
                  topTech={topTech}
                  selectedTech={selectedTech}
                  onToggle={handleToggleTech}
                />
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Main Catalog Content */}
      <section className="mx-auto w-full px-4 pb-28 sm:px-6 md:pb-36 lg:container lg:px-20">
        <div>
          {/* Status Bar */}
          <div className="text-muted-foreground mt-8 mb-6 flex min-h-8 flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
            <p role="status" aria-live="polite">
              {t("catalog.showing", {
                count: visibleProjects.length,
                total: initialProjects.length,
              })}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                type="button"
                role="switch"
                aria-checked={csOnly}
                onClick={() => setCsOnly((prev) => !prev)}
                className="hover:text-foreground flex cursor-pointer items-center gap-2.5 rounded-full py-1 text-sm font-medium transition-colors"
              >
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    csOnly ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-hidden="true"
                >
                  <i
                    className={`bg-background absolute top-0.5 left-0.5 block size-4 rounded-full shadow-xs transition-transform ${
                      csOnly ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
                <span>{t("catalog.csOnly")}</span>
              </button>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-primary hover:text-primary/80 inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 font-semibold transition-colors"
                >
                  <X className="size-4" aria-hidden="true" />
                  <span>{t("catalog.clearFilters")}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Grid of Projects */}
          {visibleProjects.length === 0 ? (
            <CatalogEmptyState
              title={t("catalog.emptyTitle")}
              description={t("catalog.emptyDescription")}
              buttonText={t("catalog.emptyButton")}
              onClear={handleClearFilters}
            />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((project, idx) => (
                <li key={project.id} className="flex justify-center">
                  <ProjectCatalogItem
                    project={project}
                    onPreview={() => setActivePreviewIndex(idx)}
                    readCaseStudyLabel={t("catalog.readCaseStudy")}
                    kindLabel={
                      project.kind && isPortfolioKindKey(project.kind)
                        ? t(`kind.${project.kind}`)
                        : project.kind || ""
                    }
                    metaText={getProjectMetaText(project)}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Pagination Load More */}
          {remainingCount > 0 ? (
            <div className="mt-16 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="border-border/80 bg-card/60 text-foreground hover:bg-muted/40 cursor-pointer rounded-full border px-8 py-3 text-sm font-medium shadow-xs transition-colors"
              >
                {t("catalog.more", { count: remainingCount })}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Modal Dialog (from Prototype) */}
      {activeProject !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeProject.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background border-border/80 text-foreground relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-6 shadow-2xl sm:p-8"
          >
            {/* Top Header Bar (.dh) */}
            <div className="border-border/60 flex items-center justify-between border-b pb-4">
              <span className="text-muted-foreground font-mono text-xs sm:text-sm">
                {(activePreviewIndex ?? 0) + 1} / {filteredProjects.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={t("catalog.previous")}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={t("catalog.next")}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <ArrowRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label={t("catalog.closeModal")}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 ml-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Two-Column Detail View (.dmw) */}
            <div className="mt-6 grid grid-cols-1 items-center gap-8 sm:gap-10 md:grid-cols-[1.3fr_1fr]">
              {/* Left: Project Preview (.dp.p) */}
              <div className="border-border/80 bg-card relative aspect-video w-full overflow-hidden rounded-2xl border shadow-xl">
                {activeProject.image ? (
                  <MediaImage
                    src={activeProject.image}
                    alt={activeProject.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="from-primary/30 via-primary/10 to-card relative flex h-full w-full items-center justify-center bg-linear-to-br">
                    <div className="size-3/5 rounded-xl bg-white/10 shadow-inner backdrop-blur-xs" />
                    <span className="font-heading text-foreground absolute text-4xl font-bold tracking-wider sm:text-5xl">
                      {getProjectInitials(activeProject.title)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Project Information (.di) */}
              <div>
                <p className="text-muted-foreground text-xs font-normal sm:text-sm">
                  {getProjectMetaText(activeProject)}
                </p>

                <h2 className="text-foreground mt-1.5 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
                  {activeProject.title}
                </h2>

                <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
                  {activeProject.description}
                </p>

                {/* Role & Period */}
                <div className="mt-5">
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {activeProject.startedAt
                      ? t("catalog.roleAndPeriod")
                      : t("catalog.role")}
                  </p>
                  <p className="text-foreground text-sm">
                    {activeProject.teamSize === 1
                      ? t("meta.solo")
                      : typeof activeProject.teamSize === "number" &&
                          activeProject.teamSize > 1
                        ? t("meta.team", { count: activeProject.teamSize })
                        : "Full-stack Developer"}
                    {activeProject.startedAt
                      ? ` · ${activeProject.startedAt.slice(0, 4)}${
                          activeProject.endedAt
                            ? `–${activeProject.endedAt.slice(0, 4)}`
                            : `–${t("meta.now")}`
                        }`
                      : ""}
                  </p>
                </div>

                {/* Impact (if decisions/metrics exist) */}
                {getImpactText(activeProject) ? (
                  <div className="mt-4">
                    <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                      {t("catalog.impact")}
                    </p>
                    <p className="text-foreground text-sm">
                      {getImpactText(activeProject)}
                    </p>
                  </div>
                ) : null}

                {/* Technology chips with SkillIcon */}
                {activeProject.skills && activeProject.skills.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeProject.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="border-border/80 bg-muted/40 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                      >
                        <SkillIcon
                          image={skill.image}
                          title={skill.title}
                          tile
                          size="sm"
                          className="size-4 rounded-xs text-[0.625rem]"
                        />
                        <span>{skill.title}</span>
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Action Buttons (.da) */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {activeProject.caseStudyEnabled && activeProject.slug ? (
                    <Link
                      href={{
                        pathname: "/projects/[slug]",
                        params: { slug: activeProject.slug },
                      }}
                      className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:brightness-110"
                    >
                      <span>{t("catalog.readCaseStudy")}</span>
                    </Link>
                  ) : null}

                  {activeProject.websiteUrl ? (
                    <a
                      href={activeProject.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border/80 hover:bg-muted/40 text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all"
                    >
                      <span>{t("actions.view")}</span>
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}

                  {activeProject.githubUrl ? (
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border/80 hover:bg-muted/40 text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all"
                    >
                      <GithubIcon className="size-4" aria-hidden="true" />
                      <span>{t("actions.source")}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground px-2 py-1 text-xs font-medium">
                      {t("catalog.privateRepo")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
