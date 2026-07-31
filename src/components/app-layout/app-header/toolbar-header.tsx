"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { RiMenu3Line, RiCloseLine, RiPaintBrushLine } from "react-icons/ri";

import LocaleSelector from "./locale-selector";
import { headerIconControlStyles } from "./toolbar-control-styles";
import { cn } from "@/lib/utils";

interface IToolbarHeaderProps {
  isMenuOpen: boolean;
  isThemeMenuOpen: boolean;
  inverted?: boolean;
  toogleMainOpen: () => void;
  toogleThemeOpen: () => void;
}

const ToolbarHeader: FC<IToolbarHeaderProps> = ({
  isMenuOpen,
  isThemeMenuOpen,
  inverted = false,
  toogleMainOpen,
  toogleThemeOpen,
}) => {
  const t = useTranslations("global.header");

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toogleThemeOpen}
        aria-pressed={isThemeMenuOpen}
        className={headerIconControlStyles(inverted, {
          active: isThemeMenuOpen,
        })}
      >
        <span className="sr-only">{t("openThemeMenu")}</span>
        <RiPaintBrushLine aria-hidden="true" className="size-[1.15rem]" />
      </button>
      <LocaleSelector inverted={inverted} />
      <button
        type="button"
        onClick={toogleMainOpen}
        aria-expanded={isMenuOpen}
        className={cn(
          headerIconControlStyles(inverted, { active: isMenuOpen }),
          "lg:hidden",
        )}
      >
        <span className="sr-only">
          {isMenuOpen ? t("closeMenu") : t("openMenu")}
        </span>
        {isMenuOpen ? (
          <RiCloseLine aria-hidden="true" className="size-[1.15rem]" />
        ) : (
          <RiMenu3Line aria-hidden="true" className="size-[1.15rem]" />
        )}
      </button>
    </div>
  );
};

export default ToolbarHeader;
