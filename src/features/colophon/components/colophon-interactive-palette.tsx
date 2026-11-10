"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useThemeContext } from "@/hoc/theme-context-provider";
import { ETheme } from "@/utils/constants/theme";
import { COLOPHON_PALETTES } from "../data";

const PALETTE_GROUPS = [
  { id: "main", label: "Main" },
  { id: "orange", label: "Orange" },
  { id: "christmas", label: "Christmas" },
] as const;

const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

const STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];

function resolveThemeEnum(group: string, mode: string): ETheme {
  const key =
    `${group.toUpperCase()}_${mode.toUpperCase()}` as keyof typeof ETheme;
  return ETheme[key] ?? ETheme.MAIN_DARK;
}

export function ColophonInteractivePalette() {
  const t = useTranslations("main.colophon");
  const { theme } = useThemeContext();
  const [selectedGroup, setSelectedGroup] = useState<
    "main" | "orange" | "christmas"
  >("main");
  const [selectedMode, setSelectedMode] = useState<"light" | "dark">("dark");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const activeThemeId = resolveThemeEnum(selectedGroup, selectedMode);

  const swatches = useMemo(() => {
    const palette = COLOPHON_PALETTES.find((p) => p.id === activeThemeId);
    return palette?.swatches ?? [];
  }, [activeThemeId]);

  const handleCopy = (hex: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      toast.success(`${hex} copied to clipboard`);
      setTimeout(() => setCopiedHex(null), 1800);
    }
  };

  const isCurrentActive = theme === activeThemeId;

  return (
    <div className="bg-card border-border flex flex-col gap-6 rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Palette selector */}
        <div
          className="bg-muted/60 inline-flex items-center rounded-xl p-1"
          role="group"
          aria-label="Palette"
        >
          {PALETTE_GROUPS.map((g) => {
            const isSelected = selectedGroup === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Mode selector */}
        <div
          className="bg-muted/60 inline-flex items-center rounded-xl p-1"
          role="group"
          aria-label="Mode"
        >
          {MODES.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swatch ramp */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:grid-cols-10">
        {swatches.map((hex, index) => {
          const isCopied = copiedHex === hex;
          return (
            <button
              key={`${activeThemeId}-${hex}-${index}`}
              type="button"
              onClick={() => handleCopy(hex)}
              className="group border-border/60 hover:border-border focus-visible:ring-primary relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center outline-hidden transition-all hover:scale-[1.02] focus-visible:ring-2"
              title={`Click to copy ${hex}`}
            >
              <div
                className="h-12 w-full rounded-lg shadow-inner transition-transform group-hover:scale-95"
                style={{ backgroundColor: hex }}
              />
              <span className="text-foreground text-xs font-bold tabular-nums">
                {STEPS[index] ?? index}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 font-mono text-[11px]">
                {isCopied ? (
                  <Check className="text-primary size-3" />
                ) : (
                  <Copy className="size-2.5 opacity-40 group-hover:opacity-100" />
                )}
                {hex}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active theme notification footer */}
      <div className="text-muted-foreground border-border/60 flex items-center justify-between border-t pt-3 text-xs">
        <p>
          {t("colors.viewing")}{" "}
          <span className="text-foreground font-semibold capitalize">
            {selectedGroup} {selectedMode}
          </span>
          {isCurrentActive && (
            <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 font-medium">
              {t("colors.currentBadge")}
            </span>
          )}
        </p>
        <span className="text-muted-foreground/80 hidden sm:inline">
          {t("colors.clickToCopy")}
        </span>
      </div>
    </div>
  );
}
