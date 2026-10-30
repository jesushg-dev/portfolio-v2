"use client";

import { useMemo, useState } from "react";
import { Award, Check, ChevronUp, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CertificateItem {
  id: string;
  company: string;
  translations?: Record<string, { title?: string }>;
}

export interface CertificatePickerProps {
  selectedCertificateIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}

function getCertificationTitle(cert: CertificateItem): string {
  const translations = Object.values(cert.translations ?? {});
  for (const trans of translations) {
    if (trans?.title?.trim()) {
      return trans.title;
    }
  }
  return cert.company;
}

interface CertificateRowProps {
  certificate: CertificateItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function CertificateRow({
  certificate,
  isSelected,
  onToggle,
}: CertificateRowProps) {
  const title = getCertificationTitle(certificate);

  return (
    <button
      type="button"
      id={`cert-item-${certificate.id}`}
      data-cert-id={certificate.id}
      aria-pressed={isSelected}
      onClick={() => onToggle(certificate.id)}
      className={`group border-border bg-card hover:border-primary/50 focus-visible:ring-primary relative flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-2 ${
        isSelected ? "border-primary/60 bg-primary/10" : ""
      }`}
    >
      <span className="bg-muted text-muted-foreground group-hover:text-foreground border-border/50 grid size-9 shrink-0 place-items-center rounded-lg border">
        <Award className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-medium">
          {title}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {certificate.company}
        </span>
      </span>
      {isSelected ? (
        <span className="bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded-full">
          <Check className="size-3.5 stroke-[2.5]" />
        </span>
      ) : (
        <span className="border-border size-5 shrink-0 rounded-full border" />
      )}
    </button>
  );
}

interface CertificateChipProps {
  title: string;
  onRemove: () => void;
  removeLabel: string;
}

function CertificateChip({
  title,
  onRemove,
  removeLabel,
}: CertificateChipProps) {
  return (
    <span className="border-border bg-muted/50 inline-flex min-h-9 max-w-64 shrink-0 items-center gap-1.5 rounded-lg border pr-1 pl-3 text-xs">
      <span className="text-foreground truncate">{title}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus-visible:ring-primary grid size-7 shrink-0 place-items-center rounded-md transition-colors outline-none focus-visible:ring-2"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

export function CertificatePicker({
  selectedCertificateIds = [],
  onChange,
  compact = false,
}: CertificatePickerProps) {
  const t = useTranslations("admin.forms.certificatePicker");
  const [search, setSearch] = useState("");
  const [trayExpanded, setTrayExpanded] = useState(false);

  const { data: { data: certifications = [] } = {}, isLoading } =
    api.certificationsAdmin.getMine.useQuery({});

  const selectedMap = useMemo(
    () => new Set(selectedCertificateIds),
    [selectedCertificateIds],
  );

  const certMap = useMemo(() => {
    const map = new Map<string, CertificateItem>();
    for (const cert of certifications) {
      map.set(cert.id, cert);
    }
    return map;
  }, [certifications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certifications;
    return certifications.filter((cert) => {
      const title = getCertificationTitle(cert).toLowerCase();
      const company = (cert.company ?? "").toLowerCase();
      return title.includes(q) || company.includes(q);
    });
  }, [certifications, search]);

  const toggleCertificate = (id: string) => {
    if (selectedMap.has(id)) {
      onChange(selectedCertificateIds.filter((item) => item !== id));
    } else {
      onChange([...selectedCertificateIds, id]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedCertificateIds.map((id) => {
          const cert = certMap.get(id);
          const title = cert ? getCertificationTitle(cert) : id;
          return (
            <CertificateChip
              key={id}
              title={title}
              onRemove={() => toggleCertificate(id)}
              removeLabel={t("clickToRemove")}
            />
          );
        })}
        {selectedCertificateIds.length === 0 && (
          <span className="text-muted-foreground text-xs">
            {t("noSelected")}
          </span>
        )}
      </div>
    );
  }

  const selectedCount = selectedCertificateIds.length;

  return (
    <div className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-4">
      {/* Search Header */}
      <div className="relative shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          id="cert-search-input"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {/* Results List */}
      <div className="min-h-64 min-w-0 flex-1 space-y-2 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2" aria-busy="true">
            <div className="bg-muted/40 h-14 animate-pulse rounded-xl" />
            <div className="bg-muted/40 h-14 animate-pulse rounded-xl" />
            <div className="bg-muted/40 h-14 animate-pulse rounded-xl" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="border-border/60 rounded-xl border border-dashed py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {certifications.length === 0
                ? t("noCertificatesYet")
                : t("noResults")}
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((cert) => (
            <CertificateRow
              key={cert.id}
              certificate={cert}
              isSelected={selectedMap.has(cert.id)}
              onToggle={toggleCertificate}
            />
          ))}
      </div>

      {/* Bottom Selected Tray */}
      <div className="border-border bg-card/90 sticky bottom-0 z-10 -mx-1 mt-auto w-full max-w-full min-w-0 shrink-0 rounded-xl border p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setTrayExpanded((prev) => !prev)}
            aria-expanded={trayExpanded}
            className="text-foreground flex items-center gap-2 text-xs font-semibold outline-none focus-visible:underline"
          >
            <span>{t("title")}</span>
            <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
              {selectedCount}
            </span>
            {selectedCount > 0 && (
              <ChevronUp
                className={`text-muted-foreground size-4 transition-transform ${
                  trayExpanded ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
            >
              {t("clearAll")}
            </Button>
          )}
        </div>

        {selectedCount === 0 ? (
          <p className="text-muted-foreground mt-1.5 text-xs">
            {t("hintEmpty")}
          </p>
        ) : (
          <div
            className={`mt-2.5 flex max-w-full min-w-0 gap-2 ${
              trayExpanded
                ? "max-h-40 flex-wrap overflow-x-hidden overflow-y-auto"
                : "w-full overflow-x-auto overflow-y-hidden"
            }`}
          >
            {selectedCertificateIds.map((id) => {
              const cert = certMap.get(id);
              const title = cert ? getCertificationTitle(cert) : id;
              return (
                <CertificateChip
                  key={id}
                  title={title}
                  onRemove={() => toggleCertificate(id)}
                  removeLabel={t("clickToRemove")}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
