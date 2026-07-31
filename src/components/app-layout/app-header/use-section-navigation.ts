"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";

import { getPathname, usePathname, useRouter } from "@/i18n/routing";

import type { NavSectionId } from "./navigation-config";

export function useSectionNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const isHome = pathname === "/";

  const navigateToSection = useCallback(
    (sectionId: NavSectionId, onComplete?: () => void) => {
      if (isHome) {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        onComplete?.();
        return;
      }

      const homePath = getPathname({ locale, href: "/" });
      router.push(`${homePath}#${sectionId}` as "/");
      onComplete?.();
    },
    [isHome, locale, router],
  );

  return { isHome, navigateToSection };
}
