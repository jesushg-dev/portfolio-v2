"use client";

import { useMemo, useState } from "react";
import { Check, ChevronUp, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const ALL_FILTER = "ALL";

function getUniqueTypes(skills: SkillOption[]): string[] {
  const types = new Set(skills.map((s) => s.type));
  return Array.from(types).sort();
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function SkillAvatar({
  image,
  title,
  size = "md",
}: {
  image: string;
  title: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const initial = (title[0] ?? "?").toUpperCase();

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        className={
          size === "sm"
            ? "size-5 rounded-md object-contain"
            : "size-8 object-contain"
        }
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`bg-primary/15 text-primary grid shrink-0 place-items-center font-mono font-bold ${
        size === "sm"
          ? "size-5 rounded-md text-[10px]"
          : "size-8 rounded-xl text-xs"
      }`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

interface SkillChipProps {
  skill: SkillOption;
  onRemove: () => void;
  removeLabel: string;
}

function SkillChip({ skill, onRemove, removeLabel }: SkillChipProps) {
  return (
    <span className="border-border bg-muted/50 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border pr-1 pl-2 text-xs">
      <SkillAvatar image={skill.image} title={skill.title} size="sm" />
      <span className="text-foreground max-w-40 truncate font-medium">
        {skill.title}
      </span>
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SkillPicker({
  availableSkills,
  selectedSkillIds: selectedSkillIdsProp,
  onChange,
  compact = false,
}: SkillPickerProps) {
  const selectedSkillIds = useMemo(
    () => selectedSkillIdsProp ?? [],
    [selectedSkillIdsProp],
  );
  const t = useTranslations("admin.forms.skillPicker");
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>(ALL_FILTER);
  const [trayExpanded, setTrayExpanded] = useState(false);

  const types = useMemo(
    () => getUniqueTypes(availableSkills),
    [availableSkills],
  );

  const selectedSkills = useMemo(() => {
    return selectedSkillIds.flatMap((id) => {
      const skill = availableSkills.find((item) => item.id === id);
      return skill ? [skill] : [];
    });
  }, [availableSkills, selectedSkillIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableSkills.filter((s) => {
      const matchesSearch = !q || s.title.toLowerCase().includes(q);
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

  const handleClearAll = () => {
    onChange([]);
  };

  // ── Compact chip-only display ─────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((s) => (
          <SkillChip
            key={s.id}
            skill={s}
            onRemove={() => toggle(s.id)}
            removeLabel={t("clickToRemove")}
          />
        ))}
        {selectedSkills.length === 0 && (
          <span className="text-muted-foreground text-xs">
            {t("noSelected")}
          </span>
        )}
      </div>
    );
  }

  const selectedCount = selectedSkillIds.length;

  // ── Full picker ───────────────────────────────────────────────────────────
  return (
    <div id="skill-picker" className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Search Header */}
      <div className="relative shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          id="skill-picker-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {/* Type filter tabs */}
      <Tabs
        value={activeType}
        onValueChange={(val) => {
          if (typeof val === "string") setActiveType(val);
        }}
        className="shrink-0"
      >
        <TabsList
          variant="pill"
          className="h-auto w-full flex-wrap justify-start gap-1.5 border-0 bg-transparent p-0"
        >
          {[ALL_FILTER, ...types].map((type) => {
            const count =
              type === ALL_FILTER
                ? availableSkills.length
                : availableSkills.filter((s) => s.type === type).length;

            return (
              <TabsTrigger
                key={type}
                value={type}
                className="inline-flex min-h-8 items-center gap-1.5 px-3 text-xs"
              >
                <span>{type === ALL_FILTER ? t("allTypes") : type}</span>
                <span className="text-[10px] tabular-nums opacity-75">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Skills grid */}
      <div
        id="skill-picker-grid"
        className="grid min-h-64 flex-1 grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-3 md:grid-cols-4"
      >
        {filtered.map((skill) => {
          const isSelected = selectedSkillIds.includes(skill.id);
          return (
            <button
              key={skill.id}
              id={`skill-picker-${skill.id}`}
              type="button"
              onClick={() => toggle(skill.id)}
              aria-pressed={isSelected}
              className={`group border-border bg-card hover:border-primary/50 focus-visible:ring-primary relative flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-2 ${
                isSelected ? "border-primary/60 bg-primary/10" : ""
              }`}
            >
              <SkillAvatar image={skill.image} title={skill.title} size="md" />
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-xs leading-tight font-semibold">
                  {skill.title}
                </span>
                <span className="text-muted-foreground block truncate text-[11px]">
                  {skill.type}
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
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full py-8 text-center text-sm">
            {t("noResults")}
          </p>
        )}
      </div>

      {/* Bottom Selected Tray */}
      <div className="border-border bg-card/90 sticky bottom-0 z-10 -mx-1 mt-auto shrink-0 rounded-xl border p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setTrayExpanded((prev) => !prev)}
            aria-expanded={trayExpanded}
            className="text-foreground flex items-center gap-2 text-xs font-semibold outline-none focus-visible:underline"
          >
            <span>{t("selectedCount", { count: selectedCount })}</span>
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
            {t("noSelected")}
          </p>
        ) : (
          <div
            className={`mt-2.5 flex gap-2 ${
              trayExpanded
                ? "max-h-40 flex-wrap overflow-y-auto"
                : "overflow-x-auto"
            }`}
          >
            {selectedSkills.map((s) => (
              <SkillChip
                key={s.id}
                skill={s}
                onRemove={() => toggle(s.id)}
                removeLabel={t("clickToRemove")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
