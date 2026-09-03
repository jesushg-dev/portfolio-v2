"use client";

import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import DesktopNav from "./desktop-nav";
import MobileNav from "./mobile-nav";
import { DesktopMegaMenu } from "./nav-menu-parts";
import ToolbarHeader from "./toolbar-header";
import ThemeSelectorLazy from "./theme-selector-lazy";
import { NAV_GROUPS } from "./navigation-config";

const Header: FC = () => {
  const t = useTranslations("global.header");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<
    (typeof NAV_GROUPS)[number]["id"] | null
  >(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
    setActiveGroup(null);
  }

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
    const handleHashChange = () => {
      setIsMenuOpen(false);
      setActiveGroup(null);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-3 z-50 px-3 transition-all duration-500 sm:px-6 lg:px-8 print:hidden"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleMegaMenuClose}
    >
      <ThemeSelectorLazy
        open={isThemeMenuOpen}
        onOpenChange={setIsThemeMenuOpen}
      />
      <nav
        aria-label={t("menu.mainNavigation")}
        className={cn(
          "relative mx-auto w-full max-w-5xl rounded-2xl px-4 py-1.5 transition-all duration-500 sm:px-6 sm:py-2",
          "border-border/40 bg-card/40 border shadow-[0_8px_32px_0_rgba(0,0,0,0.14),inset_0_1px_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl backdrop-saturate-180",
        )}
      >
        <div className="relative mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="flex w-full items-center justify-between gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
            <Link
              href="/"
              aria-label={t("homeLogo")}
              className="text-foreground z-10 inline-flex h-11 min-h-11 shrink-0 items-center text-2xl leading-none font-bold tracking-tighter transition duration-600 ease-in-out"
            >
              <span className="tracking-relaxed">
                Jehg <span className="text-foreground tracking-relaxed">.</span>
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
            <MobileNav isOpen={isMenuOpen} />
          </div>

          <DesktopMegaMenu activeGroup={activeGroup} />
        </div>
      </nav>
    </header>
  );
};

export default Header;
