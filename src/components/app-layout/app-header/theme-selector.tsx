"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { RiCheckLine, RiMoonLine, RiSunLine } from "react-icons/ri";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ETheme } from "@/utils/constants/theme";
import { type ThemeType, useThemeContext } from "@/hoc/theme-context-provider";
import { cn } from "@/lib/utils";

interface IThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ThemeGroupId = "main" | "orange" | "christmas";

interface ThemeOptionConfig {
  theme: ThemeType;
  isDark: boolean;
  accent: string;
  surface: string;
}

interface ThemeGroupConfig {
  id: ThemeGroupId;
  light: ThemeOptionConfig;
  dark: ThemeOptionConfig;
}

const THEME_GROUPS: ThemeGroupConfig[] = [
  {
    id: "main",
    light: {
      theme: ETheme.MAIN_LIGHT,
      isDark: false,
      accent: "#1e40af",
      surface: "#f8fafc",
    },
    dark: {
      theme: ETheme.MAIN_DARK,
      isDark: true,
      accent: "#3c8eff",
      surface: "#262626",
    },
  },
  {
    id: "orange",
    light: {
      theme: ETheme.ORANGE_LIGHT,
      isDark: false,
      accent: "#ff8c0e",
      surface: "#fff7ed",
    },
    dark: {
      theme: ETheme.ORANGE_DARK,
      isDark: true,
      accent: "#ff850d",
      surface: "#1a1208",
    },
  },
  {
    id: "christmas",
    light: {
      theme: ETheme.CHRISTMAS_LIGHT,
      isDark: false,
      accent: "#9b2c2c",
      surface: "#fff5f5",
    },
    dark: {
      theme: ETheme.CHRISTMAS_DARK,
      isDark: true,
      accent: "#fc8181",
      surface: "#1a0f0f",
    },
  },
];

interface ThemeChoiceProps {
  option: ThemeOptionConfig;
  groupLabel: string;
  modeLabel: string;
  selectedLabel: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeChoice: FC<ThemeChoiceProps> = ({
  option,
  groupLabel,
  modeLabel,
  selectedLabel,
  isSelected,
  onSelect,
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    aria-label={`${groupLabel} — ${modeLabel}${isSelected ? `, ${selectedLabel}` : ""}`}
    className={cn(
      "border-border hover:border-primary/40 focus-visible:ring-ring flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
      isSelected && "border-primary bg-primary/5 ring-primary/20 ring-1",
    )}
  >
    <span
      aria-hidden
      className="relative flex size-10 shrink-0 overflow-hidden rounded-lg border shadow-sm"
      style={{ backgroundColor: option.surface }}
    >
      <span
        className="absolute inset-x-0 top-0 h-3"
        style={{ backgroundColor: option.accent }}
      />
      <span className="absolute right-1 bottom-1 left-1 h-2 rounded-sm bg-black/10" />
    </span>

    <span className="min-w-0 flex-1">
      <span className="text-foreground block text-sm font-medium">
        {modeLabel}
      </span>
      <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
        {option.isDark ? (
          <RiMoonLine aria-hidden className="size-3.5" />
        ) : (
          <RiSunLine aria-hidden className="size-3.5" />
        )}
        {groupLabel}
      </span>
    </span>

    {isSelected ? (
      <span className="bg-primary text-primary-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full">
        <RiCheckLine aria-hidden className="size-3.5" />
      </span>
    ) : null}
  </button>
);

const ThemeSelector: FC<IThemeSelectorProps> = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useThemeContext();
  const t = useTranslations("global.header");

  const handleSelect = (option: ThemeOptionConfig) => {
    setTheme(option.theme, option.isDark);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("themeDialog.title")}</DialogTitle>
          <DialogDescription>{t("themeDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,28rem)] space-y-5 overflow-y-auto pr-1">
          {THEME_GROUPS.map((group) => {
            const groupLabel = t(`themeDialog.groups.${group.id}`);

            return (
              <section key={group.id} aria-label={groupLabel}>
                <h3 className="text-foreground mb-2 text-sm font-semibold">
                  {groupLabel}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ThemeChoice
                    option={group.light}
                    groupLabel={groupLabel}
                    modeLabel={t("themeDialog.light")}
                    selectedLabel={t("themeSelected")}
                    isSelected={theme === group.light.theme}
                    onSelect={() => handleSelect(group.light)}
                  />
                  <ThemeChoice
                    option={group.dark}
                    groupLabel={groupLabel}
                    modeLabel={t("themeDialog.dark")}
                    selectedLabel={t("themeSelected")}
                    isSelected={theme === group.dark.theme}
                    onSelect={() => handleSelect(group.dark)}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;
