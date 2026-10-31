"use client";

import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  getBrandAccessibleLabel,
  type SiteBrand,
} from "@/lib/site-brand/site-brand";
import SiteBrandMark from "@/components/app-layout/site-brand-mark";

import dynamic from "next/dynamic";

import DesktopNav from "./desktop-nav";
import ToolbarHeader from "./toolbar-header";
import ThemeSelectorLazy from "./theme-selector-lazy";
import { NAV_GROUPS } from "./navigation-config";

const MobileNav = dynamic(
  () => import("./mobile-nav").then((mod) => mod.MobileNav),
  { ssr: false },
);

const DesktopMegaMenu = dynamic(
  () => import("./desktop-mega-menu").then((mod) => mod.DesktopMegaMenu),
  { ssr: false },
);

const Header: FC<{ siteBrand: SiteBrand }> = ({ siteBrand }) => {
  const t = useTranslations("global.header");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasOpenedMenu, setHasOpenedMenu] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<
    (typeof NAV_GROUPS)[number]["id"] | null
  >(null);
  const [hasOpenedMegaMenu, setHasOpenedMegaMenu] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
    setActiveGroup(null);
  }

  const handleActiveGroupChange = useCallback(
    (group: (typeof NAV_GROUPS)[number]["id"] | null) => {
      if (group) setHasOpenedMegaMenu(true);
      setActiveGroup(group);
    },
    [],
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleMegaMenuClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setActiveGroup(null), 180);
  }, [clearCloseTimer]);

  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setActiveGroup(null);
  }, []);

  const toogleMainOpen = () => {
    setActiveGroup(null);
    setHasOpenedMenu(true);
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
              prefetch={false}
              aria-label={t("homeLogo", {
                brand: getBrandAccessibleLabel(siteBrand),
              })}
              className="group text-primary z-10 inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center text-2xl leading-none font-bold tracking-tighter transition duration-600 ease-in-out"
            >
              <SiteBrandMark
                brand={siteBrand}
                className={
                  siteBrand.mode === "monogram" ? "text-foreground" : undefined
                }
                dotClassName="text-primary group-hover:text-primary/80"
              />
              <span className="sr-only">
                {t("homeLogo", { brand: getBrandAccessibleLabel(siteBrand) })}
              </span>
            </Link>

            <DesktopNav
              activeGroup={activeGroup}
              onActiveGroupChange={handleActiveGroupChange}
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

          {hasOpenedMenu && (
            <div className="w-full lg:hidden">
              <MobileNav isOpen={isMenuOpen} onClose={closeMenus} />
            </div>
          )}

          {hasOpenedMegaMenu && (
            <DesktopMegaMenu activeGroup={activeGroup} onClose={closeMenus} />
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
