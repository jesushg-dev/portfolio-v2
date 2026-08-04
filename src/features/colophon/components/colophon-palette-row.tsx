"use client";

import { useTranslations } from "next-intl";

import { useThemeContext } from "@/hoc/theme-context-provider";
import type { ETheme } from "@/utils/constants/theme";

interface ColophonPaletteRowProps {
  themeId: ETheme;
  label: string;
  swatches: readonly string[];
}

export function ColophonPaletteRow({
  themeId,
  label,
  swatches,
}: ColophonPaletteRowProps) {
  const t = useTranslations("main.colophon");
  const { theme } = useThemeContext();
  const isCurrent = theme === themeId;

  return (
    <div className="p-4 sm:p-5">
      <p className="text-primaryText-700 mb-2 text-xs font-medium sm:text-sm">
        {label}
        {isCurrent ? (
          <span className="text-divider-200 font-normal">
            {" "}
            — {t("colors.currentBadge")}
          </span>
        ) : null}
      </p>
      <div
        className="flex h-10 overflow-hidden rounded sm:h-12"
        role="img"
        aria-label={label}
      >
        {swatches.map((hex) => (
          <div
            key={`${themeId}-${hex}`}
            className="flex-1"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}
