import type { FC } from "react";
import React from "react";
import { RiMenu3Line, RiCloseLine, RiPaintBrushLine } from "react-icons/ri";

import LocaleSelector from "./LocaleSelector";

interface IToolbarHeaderProps {
  isMenuOpen: boolean;
  isThemeMenuOpen: boolean;
  toogleMainOpen: () => void;
  toogleThemeOpen: () => void;
}

const ToolbarHeader: FC<IToolbarHeaderProps> = ({
  isMenuOpen,
  isThemeMenuOpen,
  toogleMainOpen,
  toogleThemeOpen,
}) => {
  return (
    <div className="flex flex-row-reverse items-center gap-2 md:order-2 md:flex-row">
      <button
        type="button"
        onClick={toogleMainOpen}
        aria-expanded={isMenuOpen}
        className="ml-1 inline-flex items-center rounded-lg p-2 text-sm hover:bg-background-100 focus:outline-none focus:ring-2 focus:ring-background-200 md:hidden"
      >
        <span className="sr-only">Open main menu</span>
        {isMenuOpen ? (
          <RiCloseLine aria-hidden="true" className="h-5 w-5" />
        ) : (
          <RiMenu3Line aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
      <LocaleSelector />
      <button
        type="button"
        onClick={toogleThemeOpen}
        className={`ml-1 inline-flex items-center rounded-lg p-2 text-sm hover:bg-background-100 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-background-200 ${
          isThemeMenuOpen ? "bg-background-100 text-primary-700" : ""
        }`}
      >
        <span className="sr-only">Open theme menu</span>
        <RiPaintBrushLine aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ToolbarHeader;
