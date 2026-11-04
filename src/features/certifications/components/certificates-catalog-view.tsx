"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Eye,
  Monitor,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/routing";
import type { CertificateType } from "@/utils/interfaces/types";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import { MediaImage } from "@/components/shared/media-image";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import CertificateItem from "./certification-item";
import { formatIssuedDate } from "@/features/certifications/lib/format-issued-date";

const PAGE_SIZE = 9;
const CATALOG_TAB_ID = "certificates-catalog-tab";
const CATALOG_PANEL_ID = "certificates-catalog-results";

export const CERT_TYPES = [
  "ALL",
  "FRONTEND",
  "BACKEND",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
] as const;

export type CertTypeFilter = (typeof CERT_TYPES)[number];
export type CertSortOption = "newest" | "oldest" | "name" | "issuer";

export const CERT_TYPE_ROUTES = {
  ALL: "/certificates",
  FRONTEND: "/certificates/frontend",
  BACKEND: "/certificates/backend",
  CYBERSECURITY: "/certificates/cybersecurity",
  DEVOPS: "/certificates/devops",
  SOFTSKILLS: "/certificates/softskills",
} as const;

export interface CertificatesCatalogViewProps {
  initialCertificates: CertificateType[];
  initialTypeSlug?: string;
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

interface TypeSegmentButtonsProps {
  currentType: CertTypeFilter;
  counts: Record<CertTypeFilter, number>;
  onSelect: (type: CertTypeFilter) => void;
  typeLabels: Record<CertTypeFilter, string>;
  ariaLabel: string;
}

export function TypeSegmentButtons({
  currentType,
  counts,
  onSelect,
  typeLabels,
  ariaLabel,
}: TypeSegmentButtonsProps) {
  const currentIndex = Math.max(0, CERT_TYPES.indexOf(currentType));

  const handleTabChange = useCallback(
    (index: number) => {
      const selected = CERT_TYPES[index] ?? "ALL";
      onSelect(selected);
    },
    [onSelect],
  );

  return (
    <div className="flex w-full justify-center px-2 sm:px-4">
      <Tab
        tabId={CATALOG_TAB_ID}
        currentTab={currentIndex}
        setCurrentTab={handleTabChange}
        ariaLabel={ariaLabel}
        className="max-w-full"
      >
        <TabItem
          icon={Eye}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.ALL}
          count={counts.ALL}
        />
        <TabItem
          icon={Monitor}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.FRONTEND}
          count={counts.FRONTEND}
        />
        <TabItem
          icon={Server}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.BACKEND}
          count={counts.BACKEND}
        />
        <TabItem
          icon={ShieldCheck}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.CYBERSECURITY}
          count={counts.CYBERSECURITY}
        />
        <TabItem
          icon={Terminal}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.DEVOPS}
          count={counts.DEVOPS}
        />
        <TabItem
          icon={Users}
          panelId={CATALOG_PANEL_ID}
          title={typeLabels.SOFTSKILLS}
          count={counts.SOFTSKILLS}
        />
      </Tab>
    </div>
  );
}

interface IssuerChipsProps {
  issuers: { name: string; count: number }[];
  selectedIssuer: string;
  onSelect: (issuer: string) => void;
  allLabel: string;
}

export function IssuerChips({
  issuers,
  selectedIssuer,
  onSelect,
  allLabel,
}: IssuerChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by issuer"
      className="flex flex-wrap justify-center gap-2"
    >
      <button
        type="button"
        aria-pressed={selectedIssuer === "ALL"}
        onClick={() => onSelect("ALL")}
        className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 py-1 text-xs font-medium transition-colors sm:text-sm ${
          selectedIssuer === "ALL"
            ? "border-primary bg-primary text-primary-foreground font-semibold"
            : "border-border/80 text-muted-foreground hover:text-foreground bg-transparent"
        }`}
      >
        <span>{allLabel}</span>
      </button>

      {issuers.map(({ name, count }) => {
        const isSelected = selectedIssuer === name;
        return (
          <button
            key={name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? "ALL" : name)}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium transition-colors sm:text-sm ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border/80 text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            <span>{name}</span>
            <span className="text-xs opacity-70">({count})</span>
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
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get(key);
  }
  return null;
}

export function CertificatesCatalogView({
  initialCertificates,
  initialTypeSlug,
  initialSearchParams,
}: CertificatesCatalogViewProps) {
  const t = useTranslations("certification");
  const locale = useLocale();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active preview certificate index in modal dialog
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(
    null,
  );

  const [selectedType, setSelectedType] = useState<CertTypeFilter>(() => {
    if (initialTypeSlug) {
      const slugUpper = initialTypeSlug.toUpperCase();
      if ((CERT_TYPES as readonly string[]).includes(slugUpper)) {
        return slugUpper as CertTypeFilter;
      }
    }
    const typeParam = getInitialUrlParam("type", initialSearchParams);
    if (
      typeParam &&
      (CERT_TYPES as readonly string[]).includes(typeParam.toUpperCase())
    ) {
      return typeParam.toUpperCase() as CertTypeFilter;
    }
    return "ALL";
  });

  const [prevTypeSlug, setPrevTypeSlug] = useState(initialTypeSlug);
  if (initialTypeSlug !== prevTypeSlug) {
    setPrevTypeSlug(initialTypeSlug);
    const slugUpper = initialTypeSlug ? initialTypeSlug.toUpperCase() : "";
    setSelectedType(
      (CERT_TYPES as readonly string[]).includes(slugUpper)
        ? (slugUpper as CertTypeFilter)
        : "ALL",
    );
  }

  const [query, setQuery] = useState(
    () => getInitialUrlParam("q", initialSearchParams) ?? "",
  );

  const [selectedIssuer, setSelectedIssuer] = useState<string>(() => {
    return getInitialUrlParam("issuer", initialSearchParams) ?? "ALL";
  });

  const [selectedTech, setSelectedTech] = useState<Set<string>>(() => {
    const techParam = getInitialUrlParam("tech", initialSearchParams);
    if (!techParam) return new Set();
    return new Set(
      techParam
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
    );
  });

  const [sort, setSort] = useState<CertSortOption>(() => {
    const sortParam = getInitialUrlParam("sort", initialSearchParams);
    return sortParam &&
      ["newest", "oldest", "name", "issuer"].includes(sortParam)
      ? (sortParam as CertSortOption)
      : "newest";
  });

  const [shownCount, setShownCount] = useState(PAGE_SIZE);

  // Sync state changes with URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (selectedType !== "ALL")
      urlParams.set("type", selectedType.toLowerCase());
    if (selectedIssuer !== "ALL") urlParams.set("issuer", selectedIssuer);
    if (selectedTech.size > 0)
      urlParams.set("tech", Array.from(selectedTech).join(","));
    if (sort !== "newest") urlParams.set("sort", sort);

    const searchString = urlParams.toString();
    const newUrl = searchString
      ? `${window.location.pathname}?${searchString}`
      : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  }, [query, selectedType, selectedIssuer, selectedTech, sort]);

  // Keyboard shortcut '/' to search
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

  // Compute top technologies from initial certificates
  const topTech = useMemo(() => {
    const techMap = new Map<string, { count: number; image?: string | null }>();
    for (const cert of initialCertificates) {
      if (!cert.skills) continue;
      for (const skill of cert.skills) {
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
      .slice(0, 10);
  }, [initialCertificates]);

  // Compute issuers with counts from initial certificates
  const issuers = useMemo(() => {
    const issuerMap = new Map<string, number>();
    for (const cert of initialCertificates) {
      if (!cert.company) continue;
      issuerMap.set(cert.company, (issuerMap.get(cert.company) ?? 0) + 1);
    }
    return Array.from(issuerMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [initialCertificates]);

  // Filter and sort certificates
  const filteredCertificates = useMemo(() => {
    const normQuery = normalizeSearch(query.trim());

    const result = initialCertificates.filter((cert) => {
      // Type filter
      if (selectedType !== "ALL") {
        const certTypes = (cert.type ?? []) as string[];
        if (!certTypes.includes(selectedType)) return false;
      }

      // Issuer filter
      if (selectedIssuer !== "ALL" && cert.company !== selectedIssuer) {
        return false;
      }

      // Technology filter
      if (selectedTech.size > 0) {
        const certTechNames = new Set(cert.skills?.map((s) => s.title) ?? []);
        for (const t of selectedTech) {
          if (!certTechNames.has(t)) return false;
        }
      }

      // Query search
      if (normQuery) {
        const searchable = normalizeSearch(
          [
            cert.title,
            cert.company,
            cert.idCredential ?? "",
            ...(cert.skills?.map((s) => s.title) ?? []),
          ].join(" "),
        );
        if (!searchable.includes(normQuery)) return false;
      }

      return true;
    });

    // Sorting
    if (sort === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "oldest") {
      result.sort((a, b) => (a.issuedDate ?? 0) - (b.issuedDate ?? 0));
    } else if (sort === "issuer") {
      result.sort(
        (a, b) =>
          a.company.localeCompare(b.company) || a.title.localeCompare(b.title),
      );
    } else {
      // default: newest first
      result.sort((a, b) => (b.issuedDate ?? 0) - (a.issuedDate ?? 0));
    }

    return result;
  }, [
    initialCertificates,
    query,
    selectedType,
    selectedIssuer,
    selectedTech,
    sort,
  ]);

  // Live count for type tabs reflecting current non-type filters
  const typeCounts = useMemo(() => {
    const normQuery = normalizeSearch(query.trim());

    const countForType = (typeFilter: CertTypeFilter) => {
      return initialCertificates.filter((cert) => {
        if (typeFilter !== "ALL") {
          const certTypes = (cert.type ?? []) as string[];
          if (!certTypes.includes(typeFilter)) return false;
        }
        if (selectedIssuer !== "ALL" && cert.company !== selectedIssuer) {
          return false;
        }
        if (selectedTech.size > 0) {
          const certTechNames = new Set(cert.skills?.map((s) => s.title) ?? []);
          for (const t of selectedTech) {
            if (!certTechNames.has(t)) return false;
          }
        }
        if (normQuery) {
          const searchable = normalizeSearch(
            [
              cert.title,
              cert.company,
              cert.idCredential ?? "",
              ...(cert.skills?.map((s) => s.title) ?? []),
            ].join(" "),
          );
          if (!searchable.includes(normQuery)) return false;
        }
        return true;
      }).length;
    };

    return {
      ALL: countForType("ALL"),
      FRONTEND: countForType("FRONTEND"),
      BACKEND: countForType("BACKEND"),
      CYBERSECURITY: countForType("CYBERSECURITY"),
      DEVOPS: countForType("DEVOPS"),
      SOFTSKILLS: countForType("SOFTSKILLS"),
    };
  }, [initialCertificates, query, selectedIssuer, selectedTech]);

  const handleTypeSelect = useCallback(
    (type: CertTypeFilter) => {
      setSelectedType(type);
      setShownCount(PAGE_SIZE);
      const targetRoute = CERT_TYPE_ROUTES[type];
      if (targetRoute) {
        router.push(targetRoute, { scroll: false });
      }
    },
    [router],
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleIssuerSelect = useCallback((issuer: string) => {
    setSelectedIssuer(issuer);
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
    setShownCount(PAGE_SIZE);
  }, []);

  const handleSortChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as CertSortOption);
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setSelectedIssuer("ALL");
    setSelectedTech(new Set());
    setSelectedType("ALL");
    setSort("newest");
    setShownCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setShownCount((prev) => prev + PAGE_SIZE);
  }, []);

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedIssuer !== "ALL" ||
    selectedTech.size > 0 ||
    selectedType !== "ALL";

  const typeLabels = useMemo(
    () => ({
      ALL: t("types.all.title"),
      FRONTEND: t("types.frontend.title"),
      BACKEND: t("types.backend.title"),
      CYBERSECURITY: t("types.cybersecurity.title"),
      DEVOPS: t("types.devops.title"),
      SOFTSKILLS: t("types.softskills.title"),
    }),
    [t],
  );

  const visibleCertificates = useMemo(() => {
    return filteredCertificates.slice(0, shownCount);
  }, [filteredCertificates, shownCount]);

  const remainingCount =
    filteredCertificates.length - visibleCertificates.length;

  const activeCert =
    activePreviewIndex !== null
      ? (filteredCertificates[activePreviewIndex] ?? null)
      : null;

  const handlePrev = useCallback(() => {
    setActivePreviewIndex((prev) => {
      if (prev === null) return null;
      return (
        (prev - 1 + filteredCertificates.length) % filteredCertificates.length
      );
    });
  }, [filteredCertificates.length]);

  const handleNext = useCallback(() => {
    setActivePreviewIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % filteredCertificates.length;
    });
  }, [filteredCertificates.length]);

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

  const handleCopyCredentialId = useCallback(() => {
    if (activeCert?.idCredential) {
      void navigator.clipboard.writeText(activeCert.idCredential);
      toast.success(t("catalog.idCopied"));
    }
  }, [activeCert, t]);

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

          {/* Type Segment Buttons */}
          <div className="mt-10 flex justify-center">
            <TypeSegmentButtons
              currentType={selectedType}
              counts={typeCounts}
              onSelect={handleTypeSelect}
              typeLabels={typeLabels}
              ariaLabel={t("types.filtersAriaLabel")}
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

            <label className="w-full sm:w-56">
              <span className="sr-only">{t("catalog.sortLabel")}</span>
              <select
                value={sort}
                onChange={handleSortChange}
                className="border-border/80 bg-background/80 text-foreground focus:border-primary focus:ring-primary/20 w-full cursor-pointer rounded-full border px-5 py-3 text-sm outline-hidden transition-all focus:ring-2"
              >
                <option value="newest">{t("catalog.sorts.newest")}</option>
                <option value="oldest">{t("catalog.sorts.oldest")}</option>
                <option value="name">{t("catalog.sorts.name")}</option>
                <option value="issuer">{t("catalog.sorts.issuer")}</option>
              </select>
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
                  {t("catalog.issuerLabel")}
                </p>
                <IssuerChips
                  issuers={issuers}
                  selectedIssuer={selectedIssuer}
                  onSelect={handleIssuerSelect}
                  allLabel={t("catalog.allIssuers")}
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
                count: visibleCertificates.length,
                total: initialCertificates.length,
              })}
            </p>

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

          {/* Grid of Certificates */}
          {visibleCertificates.length === 0 ? (
            <CatalogEmptyState
              title={t("catalog.emptyTitle")}
              description={t("catalog.emptyDescription")}
              buttonText={t("catalog.emptyButton")}
              onClear={handleClearFilters}
            />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCertificates.map((certificate, idx) => (
                <li key={certificate.id} className="flex justify-center">
                  <CertificateItem
                    {...certificate}
                    onPreview={() => setActivePreviewIndex(idx)}
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
      {activeCert !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeCert.title}
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
                {(activePreviewIndex ?? 0) + 1} / {filteredCertificates.length}
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
              {/* Left: Certificate Preview (.dp) */}
              <div className="border-border/80 relative aspect-[1.414] w-full overflow-hidden rounded-2xl border bg-white shadow-xl">
                <MediaImage
                  src={
                    activeCert.image ??
                    "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp"
                  }
                  alt={activeCert.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Right: Certificate Information (.di) */}
              <div>
                <p className="text-muted-foreground text-xs font-normal sm:text-sm">
                  {activeCert.company}
                  {activeCert.issuedDate
                    ? ` · ${formatIssuedDate(activeCert.issuedDate, locale)}`
                    : ""}
                </p>

                <h2 className="text-foreground mt-1.5 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
                  {activeCert.title}
                </h2>

                {activeCert.skills && activeCert.skills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeCert.skills.map((skill) => (
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

                {activeCert.idCredential ? (
                  <div className="mt-6">
                    <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                      {t("catalog.credentialId")}
                    </p>
                    <p className="text-foreground font-mono text-sm break-all select-all">
                      {activeCert.idCredential}
                    </p>
                  </div>
                ) : null}

                {/* Action Buttons (.da) */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {activeCert.url ? (
                    <a
                      href={activeCert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:brightness-110"
                    >
                      <span>{t("seeCertificate")}</span>
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}

                  {activeCert.idCredential ? (
                    <button
                      type="button"
                      onClick={handleCopyCredentialId}
                      className="border-border/80 hover:bg-muted/40 text-foreground inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all"
                    >
                      <span>{t("catalog.copyId")}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
