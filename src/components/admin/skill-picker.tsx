"use client";

import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillOption {
  id: string;
  title: string;
  image: string;
  type: string;
}

interface SkillPickerProps {
  availableSkills: SkillOption[];
  selectedSkillIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** Show a compact chip list instead of the full grid */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Type filter tabs
// ---------------------------------------------------------------------------

const ALL_FILTER = "ALL";

function getUniqueTypes(skills: SkillOption[]): string[] {
  const types = new Set(skills.map((s) => s.type));
  return Array.from(types).sort();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillPicker({
  availableSkills,
  selectedSkillIds: selectedSkillIdsProp,
  onChange,
  compact = false,
}: SkillPickerProps) {
  const selectedSkillIds = selectedSkillIdsProp ?? [];
  const t = useTranslations("admin.forms.skillPicker");
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>(ALL_FILTER);

  const types = useMemo(
    () => getUniqueTypes(availableSkills),
    [availableSkills],
  );

  const filtered = useMemo(() => {
    return availableSkills.filter((s) => {
      const matchesSearch = s.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesType = activeType === ALL_FILTER || s.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [availableSkills, search, activeType]);

  const toggle = (id: string) => {
    if (selectedSkillIds.includes(id)) {
      onChange(selectedSkillIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedSkillIds, id]);
    }
  };

  const selectedSkills = availableSkills.filter((s) =>
    selectedSkillIds.includes(s.id),
  );

  // ── Compact chip-only display ─────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {selectedSkills.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className="border-border bg-card text-foreground hover:border-destructive/40 hover:text-destructive flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt=""
              className="h-3.5 w-3.5 object-contain"
              loading="lazy"
              decoding="async"
            />
            {s.title}
            <span className="text-muted-foreground ml-0.5">×</span>
          </button>
        ))}
        {selectedSkills.length === 0 && (
          <span className="text-muted-foreground text-xs">
            {t("noSelected")}
          </span>
        )}
      </div>
    );
  }

  // ── Full picker ───────────────────────────────────────────────────────────
  return (
    <div id="skill-picker" className="space-y-3">
      {/* Selected counter */}
      {selectedSkillIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSkills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className="border-primary/30 bg-primary/10 text-primary hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
              title={t("clickToRemove")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                className="h-3.5 w-3.5 object-contain"
                loading="lazy"
                decoding="async"
              />
              {s.title}
              <span className="ml-0.5 opacity-60">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          id="skill-picker-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-1">
        {[ALL_FILTER, ...types].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeType === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {type === ALL_FILTER ? t("allTypes") : type}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div
        id="skill-picker-grid"
        className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5"
      >
        {filtered.map((skill) => {
          const isSelected = selectedSkillIds.includes(skill.id);
          return (
            <button
              key={skill.id}
              id={`skill-picker-${skill.id}`}
              type="button"
              onClick={() => toggle(skill.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:shadow-sm ${
                isSelected
                  ? "border-primary/40 bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              {/* Checkmark overlay */}
              {isSelected && (
                <span className="bg-primary absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full">
                  <Check className="text-primary-foreground h-2.5 w-2.5" />
                </span>
              )}
              {/* Skill image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={skill.image}
                alt={skill.title}
                className="h-8 w-8 object-contain"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-foreground line-clamp-2 text-xs leading-tight font-medium">
                {skill.title}
              </span>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[0.625rem]">
                {skill.type}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
            {t("noResults")}
          </p>
        )}
      </div>

      {/* Footer summary */}
      <p className="text-muted-foreground text-right text-xs">
        {t("selectedCount", { count: selectedSkillIds.length })}
        {filtered.length < availableSkills.length &&
          ` · ${t("shownCount", { shown: filtered.length, total: availableSkills.length })}`}
      </p>
    </div>
  );
}
