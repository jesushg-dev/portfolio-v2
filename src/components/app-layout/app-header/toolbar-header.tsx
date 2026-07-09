import type { FC } from "react";

import { RiMenu3Line, RiCloseLine, RiPaintBrushLine } from "react-icons/ri";

import LocaleSelector from "./locale-selector";
import { toolbarControlStyles } from "./toolbar-control-styles";
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
  return (
    <div className="flex flex-row-reverse items-center gap-1.5 md:order-2 md:flex-row">
      <button
        type="button"
        onClick={toogleMainOpen}
        aria-expanded={isMenuOpen}
        className={cn(
          toolbarControlStyles(inverted, {
            active: isMenuOpen,
            iconOnly: true,
          }),
          "md:hidden",
        )}
      >
        <span className="sr-only">Open main menu</span>
        {isMenuOpen ? (
          <RiCloseLine aria-hidden="true" className="size-[1.15rem]" />
        ) : (
          <RiMenu3Line aria-hidden="true" className="size-[1.15rem]" />
        )}
      </button>
      <LocaleSelector inverted={inverted} />
      <button
        type="button"
        onClick={toogleThemeOpen}
        aria-pressed={isThemeMenuOpen}
        className={toolbarControlStyles(inverted, {
          active: isThemeMenuOpen,
          iconOnly: true,
        })}
      >
        <span className="sr-only">Open theme menu</span>
        <RiPaintBrushLine aria-hidden="true" className="size-[1.15rem]" />
      </button>
    </div>
  );
};

export default ToolbarHeader;
