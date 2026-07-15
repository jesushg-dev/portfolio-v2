"use client";

import type { FC } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";

import NavButton from "./nav-button";
import ToolbarHeader from "./toolbar-header";
import ThemeSelector from "./theme-selector";
import useIsOnTop from "@/hooks/use-is-on-top";

interface IHeaderProps {
  alwaysVisible?: boolean;
}

const Header: FC<IHeaderProps> = ({ alwaysVisible = false }) => {
  const t = useTranslations("global.header");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const isOnTop = useIsOnTop();
  const path = String(pathname);
  const useSolidHeader =
    alwaysVisible ||
    /\/(skills|habilidades|vaardigheden|timeline|linea-de-tiempo|tijdlijn)(\/|$)/.test(
      path,
    );
  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsMenuOpen(false);
  };

  const toogleMainOpen = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toogleThemeOpen = () => {
    setIsThemeMenuOpen((prev) => !prev);
  };

  return (
    <header
      className={`fixed right-0 left-0 z-40 w-full transition-all duration-700 print:hidden ${
        isOnTop && !useSolidHeader
          ? "top-5 bg-transparent text-primaryText-900"
          : "bg-background-50/90 text-primaryText-900 hover:bg-background-50 top-0 shadow-sm backdrop-blur-lg backdrop-filter"
      }`}
    >
      <ThemeSelector onChange={toogleThemeOpen} visible={isThemeMenuOpen} />
      <nav className="border-background-200 rounded-sm px-2 py-3">
        <div className="container mx-auto flex max-w-(--breakpoint-xl) flex-wrap items-center justify-between md:px-6 lg:px-8">
          <Link
            href="/"
            className="group text-2xl font-bold tracking-tighter text-primary-700 transform transition duration-600 ease-in-out"
          >
            <span className="tracking-relaxed">
              Jehg{" "}
              <span className="tracking-relaxed text-secondaryText-500 group-hover:text-primary-500">
                .
              </span>
            </span>
          </Link>
          <ToolbarHeader
            {...{
              isMenuOpen,
              isThemeMenuOpen,
              inverted: false,
              toogleMainOpen,
              toogleThemeOpen,
            }}
          />
          {!useSolidHeader && (
            <div
              id="mobile-menu-language-select"
              className={`${
                isMenuOpen ? "bg-background-50 my-2 rounded-sm pb-4" : "hidden"
              } w-full items-center justify-between md:order-1 md:my-0 md:flex md:w-auto md:rounded-none md:bg-transparent md:pb-0`}
            >
              <ul className="mt-4 flex flex-col rounded-lg px-4 md:mt-0 md:flex-row md:space-x-4 md:border-0 md:text-sm md:font-medium">
                <NavButton
                  title={t("menu.home")}
                  onClick={() => handleScroll("home")}
                />
                <NavButton
                  title={t("menu.about")}
                  onClick={() => handleScroll("about")}
                />
                <NavButton
                  title={t("menu.skills")}
                  onClick={() => handleScroll("skills")}
                />
                <NavButton
                  title={t("menu.portfolio")}
                  onClick={() => handleScroll("portfolio")}
                />
                <NavButton
                  title={t("menu.contact")}
                  onClick={() => handleScroll("contact")}
                />
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
