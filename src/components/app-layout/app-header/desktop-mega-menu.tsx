"use client";

import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";

import { navGroupsForPublicSite, type NAV_GROUPS } from "./navigation-config";
import { usePublicCvVisible } from "../public-cv-visible";
import { useProcessNavPages } from "../process-nav-pages";
import { resolveNavItem, type ResolvedNavItem } from "./nav-item-resolver";
import MegaMenuItemList from "./mega-menu-item-list";
import MegaMenuPreview from "./mega-menu-preview";
import MegaMenuFooter from "./mega-menu-footer";

interface DesktopMegaMenuProps {
  activeGroup: (typeof NAV_GROUPS)[number]["id"] | null;
  onClose: () => void;
}

export const DesktopMegaMenu: FC<DesktopMegaMenuProps> = ({
  activeGroup,
  onClose,
}) => {
  const t = useTranslations("global.header.nav");
  const cvPublic = usePublicCvVisible();
  const processPages = useProcessNavPages();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo(
    () => navGroupsForPublicSite(cvPublic, processPages),
    [cvPublic, processPages],
  );

  const currentGroup = useMemo(
    () => (activeGroup ? groups.find((g) => g.id === activeGroup) : null),
    [activeGroup, groups],
  );

  const resolvedItems: ResolvedNavItem[] = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.items.map((item) => resolveNavItem(item, t));
  }, [currentGroup, t]);

  if (!activeGroup || !currentGroup || resolvedItems.length === 0) {
    return null;
  }

  const safeIndex =
    selectedIndex >= 0 && selectedIndex < resolvedItems.length
      ? selectedIndex
      : 0;
  const activeItem = resolvedItems[safeIndex] ?? resolvedItems[0];
  const groupEyebrow = t(`groups.${currentGroup.id}.eyebrow`);

  return (
    <div className="absolute inset-x-0 top-full z-50 hidden pt-2.5 lg:block">
      <div className="container mx-auto max-w-(--breakpoint-xl) px-2 md:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup}
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-border/60 bg-card/95 w-full overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 backdrop-blur-xl"
          >
            <div className="flex flex-col lg:flex-row">
              <MegaMenuItemList
                items={resolvedItems}
                selectedIndex={safeIndex}
                onSelectIndex={setSelectedIndex}
                onNavigate={onClose}
              />
              <MegaMenuPreview
                item={activeItem}
                groupEyebrow={groupEyebrow}
                onNavigate={onClose}
              />
            </div>

            <MegaMenuFooter
              availability={t("availability")}
              availabilityHint={t("availabilityHint")}
              scheduleCta={t("scheduleCta")}
              contactCta={t("contactCta")}
              onNavigate={onClose}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesktopMegaMenu;
