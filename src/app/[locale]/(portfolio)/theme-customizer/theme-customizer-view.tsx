"use client";

import { type FC, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Terminal as TerminalIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useThemeContext } from "@/hoc/theme-context-provider";
import { ETheme } from "@/utils/constants/theme";
import { cn } from "@/lib/utils";

interface ThemePreset {
  id: string;
  nameKey: string;
  isDark: boolean;
  theme: ETheme;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    foreground: string;
    border: string;
  };
}

const PRESETS: ThemePreset[] = [
  {
    id: "classic-blue",
    nameKey: "presets.classicBlue",
    isDark: true,
    theme: ETheme.MAIN_DARK,
    colors: {
      primary: "#3c8eff",
      secondary: "#80e1e9",
      background: "#0d0d0d",
      card: "#141414",
      foreground: "#d9d9d9",
      border: "#1a1a1a",
    },
  },
  {
    id: "sunset-orange",
    nameKey: "presets.sunsetOrange",
    isDark: true,
    theme: ETheme.ORANGE_DARK,
    colors: {
      primary: "#ff8c0e",
      secondary: "#ffb36c",
      background: "#0d0d0d",
      card: "#141414",
      foreground: "#d9d9d9",
      border: "#1a1a1a",
    },
  },
  {
    id: "cyberpunk",
    nameKey: "presets.cyberpunk",
    isDark: true,
    theme: ETheme.MAIN_DARK,
    colors: {
      primary: "#ff007f",
      secondary: "#00f0ff",
      background: "#05030a",
      card: "#0f0b1a",
      foreground: "#f1ebfc",
      border: "#3d2666",
    },
  },
  {
    id: "midnight-forest",
    nameKey: "presets.midnightForest",
    isDark: true,
    theme: ETheme.CHRISTMAS_DARK,
    colors: {
      primary: "#2ec4b6",
      secondary: "#c7f9cc",
      background: "#020806",
      card: "#081410",
      foreground: "#eefaf6",
      border: "#14352a",
    },
  },
  {
    id: "synthwave",
    nameKey: "presets.synthwave",
    isDark: true,
    theme: ETheme.MAIN_DARK,
    colors: {
      primary: "#f72585",
      secondary: "#7209b7",
      background: "#0a0908",
      card: "#1b1917",
      foreground: "#f4f3f2",
      border: "#2e2b2a",
    },
  },
  {
    id: "sunset-rose",
    nameKey: "presets.sunsetRose",
    isDark: false,
    theme: ETheme.MAIN_LIGHT,
    colors: {
      primary: "#e05a8d",
      secondary: "#ffb3c6",
      background: "#fdfafb",
      card: "#ffffff",
      foreground: "#3d242e",
      border: "#ebd5dd",
    },
  },
];

const ThemeCustomizerView: FC = () => {
  const router = useRouter();
  const t = useTranslations("themeCustomizer");
  const { setTheme, saveCustomTheme, clearCustomTheme } = useThemeContext();

  const [customColors, setCustomColors] = useState({
    primary: "#3c8eff",
    secondary: "#80e1e9",
    background: "#0d0d0d",
    card: "#141414",
    foreground: "#d9d9d9",
    border: "#1a1a1a",
  });
  const [baseIsDark, setBaseIsDark] = useState<boolean>(true);

  // Initialize customizer values from localStorage or default preset
  useEffect(() => {
    const active =
      window.localStorage.getItem("custom-theme-active") === "true";
    const timer = setTimeout(() => {
      if (active) {
        setCustomColors({
          primary:
            window.localStorage.getItem("custom-theme-primary") ?? "#3c8eff",
          secondary:
            window.localStorage.getItem("custom-theme-secondary") ?? "#80e1e9",
          background:
            window.localStorage.getItem("custom-theme-background") ?? "#0d0d0d",
          card: window.localStorage.getItem("custom-theme-card") ?? "#141414",
          foreground:
            window.localStorage.getItem("custom-theme-foreground") ?? "#d9d9d9",
          border:
            window.localStorage.getItem("custom-theme-border") ?? "#1a1a1a",
        });
        setBaseIsDark(window.localStorage.getItem("color-mode") === "dark");
      } else {
        // Load default values based on current active base theme
        const isCurrentDark =
          window.localStorage.getItem("color-mode") === "dark";
        setBaseIsDark(isCurrentDark);
        const defaultColors = isCurrentDark
          ? PRESETS[0].colors
          : PRESETS[5].colors;
        setCustomColors(defaultColors);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Update variables in real time as the user plays
  const updateVariable = (key: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    const root = document.documentElement;
    root.style.setProperty(`--${key}`, value);
  };

  const applyPreset = (preset: ThemePreset) => {
    setCustomColors(preset.colors);
    setBaseIsDark(preset.isDark);
    setTheme(preset.theme, preset.isDark);

    const root = document.documentElement;
    Object.entries(preset.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
  };

  const handleToggleBase = (isDarkBase: boolean) => {
    setBaseIsDark(isDarkBase);
    const targetTheme = isDarkBase ? ETheme.MAIN_DARK : ETheme.MAIN_LIGHT;
    setTheme(targetTheme, isDarkBase);

    // Reapply current sliders over the new base theme
    const root = document.documentElement;
    Object.entries(customColors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
  };

  const handleSave = () => {
    saveCustomTheme(customColors);
    toast.success(t("actions.success"));
    router.push("/");
  };

  const handleReset = () => {
    clearCustomTheme();
    // Reset inputs back to default theme settings
    const isCurrentDark = window.localStorage.getItem("color-mode") === "dark";
    const defaultColors = isCurrentDark ? PRESETS[0].colors : PRESETS[5].colors;
    setCustomColors(defaultColors);
    setBaseIsDark(isCurrentDark);
    toast.info(t("actions.reset"));
  };

  const handleCancel = () => {
    // If not custom active, revert variables. If it was active, reload them from localstorage.
    const active =
      window.localStorage.getItem("custom-theme-active") === "true";
    const root = document.documentElement;
    if (active) {
      const p = window.localStorage.getItem("custom-theme-primary");
      const s = window.localStorage.getItem("custom-theme-secondary");
      const bg = window.localStorage.getItem("custom-theme-background");
      const cd = window.localStorage.getItem("custom-theme-card");
      const fg = window.localStorage.getItem("custom-theme-foreground");
      const bd = window.localStorage.getItem("custom-theme-border");
      if (p) root.style.setProperty("--primary", p);
      if (s) root.style.setProperty("--secondary", s);
      if (bg) root.style.setProperty("--background", bg);
      if (cd) root.style.setProperty("--card", cd);
      if (fg) root.style.setProperty("--foreground", fg);
      if (bd) root.style.setProperty("--border", bd);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--border");
    }
    router.push("/");
  };

  return (
    <section className="bg-background text-foreground min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="group border-border text-foreground hover:bg-muted/50 mb-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("actions.cancel")}</span>
        </button>

        {/* Title Section */}
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <Palette className="text-primary size-8" />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
          </div>
          <p className="text-foreground mt-2 max-w-2xl text-sm">
            {t("subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Controls Panel */}
          <main className="space-y-8 lg:col-span-5">
            {/* Presets */}
            <section className="bg-card text-card-foreground border-border rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="text-primary size-4.5" />
                <h2 className="text-sm font-bold tracking-wide uppercase">
                  {t("presets")}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="border-border hover:border-primary/40 hover:bg-muted/30 flex h-11 cursor-pointer items-center gap-2 rounded-xl border p-2 text-left text-sm font-semibold transition-all"
                  >
                    <span
                      className="relative size-5 shrink-0 overflow-hidden rounded-md border shadow-sm"
                      style={{ backgroundColor: preset.colors.background }}
                    >
                      <span
                        className="absolute inset-x-0 top-0 h-1.5"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                    </span>
                    <span className="truncate">
                      {preset.id === "classic-blue" && "Classic Blue"}
                      {preset.id === "sunset-orange" && "Sunset Orange"}
                      {preset.id === "cyberpunk" && "Cyberpunk Neon"}
                      {preset.id === "midnight-forest" && "Midnight Forest"}
                      {preset.id === "synthwave" && "Synthwave Night"}
                      {preset.id === "sunset-rose" && "Sunset Rose"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Base Style Toggles */}
            <section className="bg-card text-card-foreground border-border rounded-2xl border p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold tracking-wide uppercase">
                {t("baseStyle")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleBase(false)}
                  className={cn(
                    "border-border flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all",
                    !baseIsDark &&
                      "border-primary bg-primary/5 ring-primary/20 ring-1",
                  )}
                >
                  <Sun className="size-4 text-orange-500" />
                  <span>{t("light")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBase(true)}
                  className={cn(
                    "border-border flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all",
                    baseIsDark &&
                      "border-primary bg-primary/5 ring-primary/20 ring-1",
                  )}
                >
                  <Moon className="size-4 text-blue-400" />
                  <span>{t("dark")}</span>
                </button>
              </div>
            </section>

            {/* Custom Color Selectors */}
            <section className="space-y-3">
              {/* Primary */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="primary-color"
                    type="color"
                    value={customColors.primary}
                    onChange={(e) => updateVariable("primary", e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.primary }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="primary-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("primaryAccent")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.primary.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Secondary */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="secondary-color"
                    type="color"
                    value={customColors.secondary}
                    onChange={(e) =>
                      updateVariable("secondary", e.target.value)
                    }
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.secondary }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="secondary-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("secondaryAccent")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.secondary.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Background */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="background-color"
                    type="color"
                    value={customColors.background}
                    onChange={(e) =>
                      updateVariable("background", e.target.value)
                    }
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.background }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="background-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("background")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.background.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="card-color"
                    type="color"
                    value={customColors.card}
                    onChange={(e) => updateVariable("card", e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.card }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="card-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("card")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.card.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Foreground */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="foreground-color"
                    type="color"
                    value={customColors.foreground}
                    onChange={(e) =>
                      updateVariable("foreground", e.target.value)
                    }
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.foreground }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="foreground-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("text")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.foreground.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Border */}
              <div className="border-border bg-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-3 transition-colors">
                <div className="border-border relative size-11 cursor-pointer overflow-hidden rounded-lg border">
                  <input
                    id="border-color"
                    type="color"
                    value={customColors.border}
                    onChange={(e) => updateVariable("border", e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div
                    className="size-full"
                    style={{ backgroundColor: customColors.border }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="border-color"
                    className="text-foreground block cursor-pointer text-sm font-semibold"
                  >
                    {t("border")}
                  </label>
                  <span className="text-foreground font-mono text-sm">
                    {customColors.border.toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <footer className="flex flex-col gap-2 pt-4">
              <button
                type="button"
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/95 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all"
              >
                <Save className="size-4.5" />
                <span>{t("actions.save")}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="border-border text-foreground hover:bg-muted/50 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all"
                >
                  <RotateCcw className="size-4" />
                  <span>{t("actions.reset")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border-border text-foreground hover:bg-muted/50 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all"
                >
                  <span>{t("actions.cancel")}</span>
                </button>
              </div>
            </footer>
          </main>

          {/* Interactive Live Preview */}
          <aside
            aria-hidden="true"
            className="flex flex-col gap-4 lg:col-span-7"
          >
            <div className="bg-card text-card-foreground border-border sticky top-28 rounded-3xl border p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-2 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold tracking-wide uppercase">
                  {t("preview.title")}
                </h2>
              </div>
              <p className="text-foreground mb-6 text-sm">
                {t("preview.desc")}
              </p>

              {/* Preview Interface Mockups */}
              <div className="space-y-6">
                {/* Mock Header */}
                <div className="border-border bg-background flex items-center justify-between rounded-2xl border p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold">
                      JEHG
                    </span>
                    <span className="font-mono text-sm font-bold">
                      portfolio
                    </span>
                  </div>
                  <nav className="flex items-center gap-1">
                    <span className="text-primary bg-primary/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold">
                      Home
                    </span>
                    <span className="text-foreground px-2.5 py-1.5 text-[10px] font-medium">
                      About
                    </span>
                    <span className="text-foreground px-2.5 py-1.5 text-[10px] font-medium">
                      Projects
                    </span>
                  </nav>
                </div>

                {/* Mock Card */}
                <div className="border-border bg-card rounded-2xl border p-5 shadow-md">
                  <span className="text-foreground text-[10px] font-bold tracking-wider uppercase">
                    {t("preview.tag1")}
                  </span>
                  <div className="text-foreground mt-1 text-base font-bold">
                    {t("preview.cardTitle")}
                  </div>
                  <div className="text-foreground mt-2 text-sm leading-relaxed">
                    {t("preview.cardDesc")}
                  </div>

                  <div className="mt-4 flex gap-1.5">
                    <span className="bg-primary/10 text-foreground border-border rounded-md border px-2 py-1 text-[10px] font-semibold">
                      {t("preview.tag1")}
                    </span>
                    <span className="bg-primary/10 text-foreground border-border rounded-md border px-2 py-1 text-[10px] font-semibold">
                      {t("preview.tag2")}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex h-9 items-center justify-center rounded-lg px-4 text-sm font-bold">
                      {t("preview.btn1")}
                    </div>
                    <div className="border-border text-foreground flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-semibold">
                      {t("preview.btn2")}
                    </div>
                  </div>
                </div>

                {/* Mock Terminal */}
                <div className="border-border bg-background rounded-2xl border p-4 font-mono text-[11px] leading-relaxed shadow-sm">
                  <header className="border-border text-foreground mb-3 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5">
                      <TerminalIcon className="size-3.5" />
                      <span>{t("preview.terminalTitle")}</span>
                    </div>
                    <span className="bg-primary size-2 rounded-full" />
                  </header>
                  <div className="text-foreground space-y-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-primary">$</span>
                      <span>npm run test:a11y</span>
                    </div>
                    <div className="text-secondary">
                      ✓ accessibility audits successfully passed
                    </div>
                    <div>Test Suites: 7 passed, 7 total</div>
                    <div className="text-primary font-bold">
                      All systems operating normally.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ThemeCustomizerView;
