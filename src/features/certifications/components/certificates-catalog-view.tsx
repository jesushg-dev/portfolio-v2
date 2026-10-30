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
  Search,
  X,
  Eye,
  Monitor,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

import { Link, useRouter } from "@/i18n/routing";
import type { CertificateType } from "@/utils/interfaces/types";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { buttonVariants } from "@/components/ui/button";
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
export type CertSortOption = "newest" | "name" | "issuer";

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
          title={`${typeLabels.ALL} (${counts.ALL})`}
        />
        <TabItem
          icon={Monitor}
          panelId={CATALOG_PANEL_ID}
          title={`${typeLabels.FRONTEND} (${counts.FRONTEND})`}
        />
        <TabItem
          icon={Server}
          panelId={CATALOG_PANEL_ID}
          title={`${typeLabels.BACKEND} (${counts.BACKEND})`}
        />
        <TabItem
          icon={ShieldCheck}
          panelId={CATALOG_PANEL_ID}
          title={`${typeLabels.CYBERSECURITY} (${counts.CYBERSECURITY})`}
        />
        <TabItem
          icon={Terminal}
          panelId={CATALOG_PANEL_ID}
          title={`${typeLabels.DEVOPS} (${counts.DEVOPS})`}
        />
        <TabItem
          icon={Users}
          panelId={CATALOG_PANEL_ID}
          title={`${typeLabels.SOFTSKILLS} (${counts.SOFTSKILLS})`}
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
      className="flex flex-wrap gap-2"
    >
      <button
        type="button"
        aria-pressed={selectedIssuer === "ALL"}
        onClick={() => onSelect("ALL")}
        className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
          selectedIssuer === "ALL"
            ? "border-primary bg-primary text-primary-foreground font-semibold"
            : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
        }`}
      >
        {allLabel}
      </button>

      {issuers.map(({ name, count }) => {
        const isSelected = selectedIssuer === name;
        return (
          <button
            key={name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(name)}
            className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <GraduationCap className="size-3.5" aria-hidden="true" />
            <span>{name}</span>
            <span
              className={`text-sm font-bold ${
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
            className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
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
              className={`text-sm font-bold ${
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
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 cursor-pointer rounded-full px-6 py-2.5 text-sm font-bold transition-all"
      >
        {buttonText}
      </button>
    </div>
  );
}

export function CertificatesStudyBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[58rem] overflow-hidden select-none"
    >
      {/* Ambient Top Light Beam illuminating the study canvas */}
      <div className="absolute top-0 left-1/2 h-[24rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_70%)] opacity-85 blur-3xl" />

      {/* Blueprint Grid + Study & Development Geometry */}
      <div className="text-border/70 absolute inset-0 [mask-image:radial-gradient(ellipse_85%_65%_at_50%_18%,#000_50%,transparent_95%)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="study-dev-grid-pattern"
              width={48}
              height={48}
              patternUnits="userSpaceOnUse"
              x="50%"
              y="0"
            >
              {/* Technical Grid Cell Lines */}
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.45"
              />

              {/* Sub-grid micro dots */}
              <circle
                cx="24"
                cy="24"
                r="1"
                fill="currentColor"
                fillOpacity="0.3"
              />

              {/* Intersection coordinate plus mark (+) at each node */}
              <path
                d="M 0 3.5 L 0 -3.5 M -3.5 0 L 3.5 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.85"
              />
            </pattern>
          </defs>

          {/* Grid pattern fill */}
          <rect
            width="100%"
            height="100%"
            fill="url(#study-dev-grid-pattern)"
          />

          {/* Academic & Engineering Blueprint Schematics (Study & Development motif) */}
          <g
            stroke="currentColor"
            fill="none"
            strokeWidth="1"
            className="text-primary/30"
          >
            {/* Concentric study drafting arcs (graduation/engineering calibration compass) */}
            <circle
              cx="50%"
              cy="150"
              r="230"
              strokeDasharray="4 8"
              strokeOpacity="0.4"
            />
            <circle
              cx="50%"
              cy="150"
              r="360"
              strokeDasharray="2 12"
              strokeOpacity="0.25"
            />

            {/* Continuous Learning & Development Git-like Pipeline Axis */}
            <line
              x1="12%"
              y1="190"
              x2="88%"
              y2="190"
              strokeOpacity="0.35"
              strokeDasharray="6 6"
            />

            {/* Learning Milestone 01: Foundations */}
            <circle
              cx="20%"
              cy="190"
              r="4"
              fill="currentColor"
              fillOpacity="0.6"
            />
            <circle cx="20%" cy="190" r="8" strokeOpacity="0.3" />

            {/* Learning Milestone 02: Architecture */}
            <circle
              cx="40%"
              cy="190"
              r="4"
              fill="currentColor"
              fillOpacity="0.6"
            />
            <circle cx="40%" cy="190" r="8" strokeOpacity="0.3" />

            {/* Learning Milestone 03: Fullstack Development */}
            <circle
              cx="60%"
              cy="190"
              r="4"
              fill="currentColor"
              fillOpacity="0.6"
            />
            <circle cx="60%" cy="190" r="8" strokeOpacity="0.3" />

            {/* Learning Milestone 04: Verified Mastery */}
            <circle
              cx="80%"
              cy="190"
              r="4"
              fill="currentColor"
              fillOpacity="0.6"
            />
            <circle cx="80%" cy="190" r="8" strokeOpacity="0.3" />
          </g>

          {/* Subtle Developer Code & Milestone Markers */}
          <g className="fill-primary/35 font-mono text-[10px] tracking-widest uppercase select-none">
            <text x="14%" y="178">
              {"// 01: Foundations"}
            </text>
            <text x="34%" y="178">
              {"// 02: Architecture"}
            </text>
            <text x="54%" y="178">
              {"// 03: Fullstack"}
            </text>
            <text x="74%" y="178">
              {"// 04: Verified"}
            </text>

            {/* Subtle engineering tokens in ambient corners */}
            <text x="8%" y="95" className="fill-foreground/20">
              &lt;dev.learn /&gt;
            </text>
            <text x="82%" y="95" className="fill-foreground/20">
              &#123; status: &quot;verified&quot; &#125;
            </text>
            <text x="8%" y="280" className="fill-foreground/20">
              git: main*
            </text>
            <text x="78%" y="280" className="fill-foreground/20">
              fn(study) =&gt; mastery
            </text>
          </g>
        </svg>
      </div>
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

  // Active preview certificate in lightbox modal
  const [activePreview, setActivePreview] = useState<CertificateType | null>(
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

  // Adjust selectedType during render when initialTypeSlug changes (standard React pattern)
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
        .map((t) => t.trim())
        .filter(Boolean),
    );
  });

  const [sort, setSort] = useState<CertSortOption>(() => {
    const sortParam = getInitialUrlParam("sort", initialSearchParams);
    return sortParam && ["newest", "name", "issuer"].includes(sortParam)
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

  // Keyboard shortcut '/' to search, 'Esc' to clear query
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

      // Technology filter (requires all selected tech to be validated by the certificate)
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

  const hasActiveFilters = Boolean(
    query ||
    selectedType !== "ALL" ||
    selectedIssuer !== "ALL" ||
    selectedTech.size > 0 ||
    sort !== "newest",
  );

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setSelectedType("ALL");
    setSelectedIssuer("ALL");
    setSelectedTech(new Set());
    setSort("newest");
    setShownCount(PAGE_SIZE);
    router.push("/certificates");
  }, [router]);

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

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleTypeSelect = useCallback(
    (t: CertTypeFilter) => {
      setSelectedType(t);
      setShownCount(PAGE_SIZE);
      router.push(CERT_TYPE_ROUTES[t]);
    },
    [router],
  );

  const handleIssuerSelect = useCallback((issuer: string) => {
    setSelectedIssuer(issuer);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleSortChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as CertSortOption);
    setShownCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setShownCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleOpenPreview = useCallback((cert: CertificateType) => {
    setActivePreview(cert);
  }, []);

  const handleClosePreview = useCallback(() => {
    setActivePreview(null);
  }, []);

  const typeLabels: Record<CertTypeFilter, string> = useMemo(
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

  return (
    <section
      aria-label={t("catalog.pageTitle")}
      className="relative mx-auto w-full overflow-hidden px-4 pt-24 pb-20 sm:px-6 sm:pt-28 lg:container lg:px-20"
    >
      {/* Subtle Study & Development Blueprint Grid Background */}
      <CertificatesStudyBackground />

      {/* Back to Portfolio Link */}
      <Link
        href="/"
        className="text-muted-foreground hover:text-primary mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors"
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

      {/* Canonical Type Segment Control */}
      <div className="mt-10 flex justify-center">
        <TypeSegmentButtons
          currentType={selectedType}
          counts={typeCounts}
          onSelect={handleTypeSelect}
          typeLabels={typeLabels}
          ariaLabel={t("types.filtersAriaLabel")}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="border-border bg-card/70 mt-8 rounded-[2rem] border p-4 shadow-xs backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* Search Box */}
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
            <kbd className="border-border text-muted-foreground pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded border px-1.5 text-sm md:block">
              /
            </kbd>
          </label>

          {/* Sort Selector */}
          <label className="md:w-64">
            <span className="sr-only">{t("catalog.sortLabel")}</span>
            <select
              value={sort}
              onChange={handleSortChange}
              className="border-border bg-background focus:border-primary text-foreground focus:ring-primary/10 w-full cursor-pointer rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-4"
            >
              <option value="newest">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.newest")}`}</option>
              <option value="name">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.name")}`}</option>
              <option value="issuer">{`${t("catalog.sortLabel")}: ${t("catalog.sorts.issuer")}`}</option>
            </select>
          </label>
        </div>

        {/* Filter Chips: Issuers and Technologies */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-bold tracking-wider uppercase">
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
            <p className="text-muted-foreground mb-2 text-sm font-bold tracking-wider uppercase">
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

      <div
        id={CATALOG_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`${CATALOG_TAB_ID}-tab-${CERT_TYPES.indexOf(selectedType)}`}
        tabIndex={0}
      >
        {/* Filter Status Bar */}
        <div className="text-muted-foreground mt-5 flex min-h-8 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-sm">
          <p role="status" aria-live="polite">
            {t("catalog.showing", {
              count: filteredCertificates.length,
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

        {/* Certificates Grid or Empty State */}
        {visibleCertificates.length === 0 ? (
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
            className={`mt-6 grid items-stretch gap-6 ${
              visibleCertificates.length === 1
                ? "mx-auto max-w-md grid-cols-1"
                : visibleCertificates.length === 2
                  ? "mx-auto max-w-4xl grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {visibleCertificates.map((certificate, idx) => (
              <motion.li
                layout
                key={certificate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.04 }}
                className="flex justify-center"
              >
                <CertificateItem
                  {...certificate}
                  onPreview={handleOpenPreview}
                />
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
              className="border-border bg-card text-foreground hover:border-primary/50 hover:text-primary cursor-pointer rounded-full border px-7 py-3 text-sm font-bold shadow-xs transition-colors"
            >
              {t("catalog.more", { count: remainingCount })}
            </button>
          </div>
        ) : null}
      </div>

      {/* Reusable Image Lightbox Modal */}
      <ImageLightbox
        isOpen={Boolean(activePreview)}
        onClose={handleClosePreview}
        src={
          activePreview?.image ??
          "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp"
        }
        alt={activePreview?.title ?? ""}
        title={
          <div className="flex items-center gap-2.5">
            <span className="border-border/70 bg-primary/10 text-primary flex size-8.5 shrink-0 items-center justify-center rounded-xl border">
              <GraduationCap className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-foreground truncate font-bold">
              {activePreview?.title}
            </span>
          </div>
        }
        subtitle={
          activePreview ? (
            <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm">
              <span className="border-border/60 bg-muted/40 text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold">
                {activePreview.company}
              </span>
              {activePreview.issuedDate ? (
                <span>
                  {formatIssuedDate(activePreview.issuedDate, locale)}
                </span>
              ) : null}
              {activePreview.idCredential ? (
                <span className="border-border/50 bg-muted/30 text-muted-foreground inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]">
                  ID: {activePreview.idCredential}
                </span>
              ) : null}
            </div>
          ) : null
        }
        footer={
          activePreview ? (
            <div className="flex w-full flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              {activePreview.skills && activePreview.skills.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activePreview.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="border-border/60 bg-muted/40 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium shadow-xs"
                    >
                      <SkillIcon
                        image={skill.image}
                        title={skill.title}
                        tile
                        size="sm"
                        className="size-3.5 rounded-xs text-[8px]"
                      />
                      <span>{skill.title}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="border-border/60 bg-muted/40 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold shadow-xs">
                    <CheckCircle2
                      className="text-primary size-3.5"
                      aria-hidden="true"
                    />
                    <span>{t("catalog.verify")}</span>
                  </span>
                  <span className="border-border/60 bg-muted/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium shadow-xs">
                    <span>{activePreview.company} Certified</span>
                  </span>
                </div>
              )}

              {activePreview.url ? (
                <a
                  href={activePreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "default",
                    className:
                      "inline-flex shrink-0 cursor-pointer items-center gap-2 font-bold shadow-md",
                  })}
                >
                  <span>{t("seeCertificate")}</span>
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null
        }
        closeAriaLabel={t("catalog.closeModal")}
      />
    </section>
  );
}
