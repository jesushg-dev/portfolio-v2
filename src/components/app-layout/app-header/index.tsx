"use client";

import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

import DesktopNav from "./desktop-nav";
import MobileNav from "./mobile-nav";
import { DesktopMegaMenu } from "./nav-menu-parts";
import ToolbarHeader from "./toolbar-header";
import ThemeSelectorLazy from "./theme-selector-lazy";
import useIsOnTop from "@/hooks/use-is-on-top";
import { NAV_GROUPS } from "./navigation-config";

interface IHeaderProps {
  /** Solid sticky header — set by route-group layouts (portfolio, admin, etc.). */
  alwaysVisible?: boolean;
}

const Header: FC<IHeaderProps> = ({ alwaysVisible = false }) => {
  const t = useTranslations("global.header");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<
    (typeof NAV_GROUPS)[number]["id"] | null
  >(null);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnTop = useIsOnTop();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleMegaMenuClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setActiveGroup(null), 160);
  }, [clearCloseTimer]);

  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setActiveGroup(null);
  }, []);

  const toogleMainOpen = () => {
    setActiveGroup(null);
    setIsMenuOpen((prev) => !prev);
  };

  const toogleThemeOpen = () => {
    setIsThemeMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setActiveGroup(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenus]);

  const isTransparent = isOnTop && !alwaysVisible;

  return (
    <header
      ref={headerRef}
      className={`fixed right-0 left-0 z-40 w-full transition-all duration-700 print:hidden ${
        isTransparent
          ? "text-primaryText-900 top-5 bg-transparent"
          : "bg-background-50/90 text-primaryText-900 hover:bg-background-50 top-0 shadow-sm backdrop-blur-lg backdrop-filter"
      }`}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleMegaMenuClose}
    >
      <ThemeSelectorLazy
        open={isThemeMenuOpen}
        onOpenChange={setIsThemeMenuOpen}
      />
      <nav
        aria-label={t("menu.mainNavigation")}
        className="relative px-4 py-3 sm:px-6 lg:px-8"
      >
        <div className="relative mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="flex w-full items-center justify-between gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
            <Link
              href="/"
              aria-label={t("homeLogo")}
              className="group text-primary-700 z-10 shrink-0 transform text-2xl leading-none font-bold tracking-tighter transition duration-600 ease-in-out"
            >
              <span className="tracking-relaxed">
                Jehg{" "}
                <span className="tracking-relaxed text-secondaryText-500 group-hover:text-primary-500">
                  .
                </span>
              </span>
            </Link>

            <DesktopNav
              activeGroup={activeGroup}
              onActiveGroupChange={setActiveGroup}
              className="justify-self-center"
            />

            <div className="z-10 flex shrink-0 items-center justify-end lg:justify-self-end">
              <ToolbarHeader
                {...{
                  isMenuOpen,
                  isThemeMenuOpen,
                  inverted: false,
                  toogleMainOpen,
                  toogleThemeOpen,
                }}
              />
            </div>
          </div>

          <div className="w-full lg:hidden">
            <MobileNav isOpen={isMenuOpen} onNavigate={closeMenus} />
          </div>

          <DesktopMegaMenu
            activeGroup={activeGroup}
            onNavigate={() => setActiveGroup(null)}
          />
        </div>
      </nav>
    </header>
  );
};

export default Header;
