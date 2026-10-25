"use client";

import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  homeSectionHref,
  navGroupsForPublicSite,
  type NAV_GROUPS,
} from "./navigation-config";
import { usePublicCvVisible } from "../public-cv-visible";
import { useProcessNavPages } from "../process-nav-pages";
import { resolveNavItem } from "./nav-item-resolver";
import LocaleSelector from "./locale-selector";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("global.header.nav");
  const cvPublic = usePublicCvVisible();
  const processPages = useProcessNavPages();

  const [openGroup, setOpenGroup] = useState<
    (typeof NAV_GROUPS)[number]["id"] | null
  >("about");

  const groups = useMemo(
    () => navGroupsForPublicSite(cvPublic, processPages),
    [cvPublic, processPages],
  );

  const toggleGroup = (groupId: (typeof NAV_GROUPS)[number]["id"]) => {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="border-border/60 bg-card/98 mt-2.5 flex max-h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 backdrop-blur-xl lg:hidden"
        >
          <div className="overflow-y-auto overscroll-contain p-2">
            {groups.map((group) => {
              const Icon = group.icon;
              const isGroupOpen = openGroup === group.id;
              const resolvedItems = group.items.map((item) =>
                resolveNavItem(item, t),
              );

              return (
                <section
                  key={group.id}
                  className="border-border/50 border-b last:border-b-0"
                >
                  <button
                    type="button"
                    aria-expanded={isGroupOpen}
                    onClick={() => toggleGroup(group.id)}
                    className="text-foreground hover:bg-accent/40 flex min-h-14 w-full cursor-pointer items-center justify-between px-3 text-base font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        aria-hidden="true"
                        className="text-primary size-4.5"
                      />
                      <span>{t(`groups.${group.id}.label`)}</span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "text-muted-foreground size-4 transition-transform duration-200",
                        isGroupOpen && "text-primary rotate-180",
                      )}
                    />
                  </button>

                  {isGroupOpen ? (
                    <div className="space-y-1 px-1 pb-3">
                      {resolvedItems.map((item) => {
                        const ItemIcon = item.icon;
                        const sharedClass = cn(
                          "flex min-h-13 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring/40 outline-none",
                          item.comingSoon
                            ? "cursor-default opacity-75"
                            : "cursor-pointer hover:bg-accent/50 active:bg-accent/70",
                        );

                        const content = (
                          <>
                            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                              <ItemIcon
                                aria-hidden="true"
                                className="size-4.5"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="text-foreground block text-sm leading-snug font-semibold">
                                  {item.label}
                                </span>
                                {item.comingSoon ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-4.5 px-1.5 text-[0.625rem]"
                                  >
                                    Soon
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                                {item.short}
                              </span>
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className="text-muted-foreground/60 size-4 shrink-0"
                            />
                          </>
                        );

                        if (item.comingSoon) {
                          return (
                            <div key={item.id} className={sharedClass}>
                              {content}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onNavigate={onClose}
                            className={sharedClass}
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="border-border/50 bg-muted/40 space-y-3 border-t p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                <strong className="text-foreground font-semibold">
                  {t("availability")}
                </strong>
              </div>
              <LocaleSelector />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/schedule"
                onNavigate={onClose}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "h-11 justify-center gap-1.5 rounded-full text-xs font-medium sm:text-sm",
                )}
              >
                <Calendar aria-hidden="true" className="size-3.5" />
                <span>{t("scheduleCta")}</span>
              </Link>
              <Link
                href={homeSectionHref("contact")}
                onNavigate={onClose}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "h-11 justify-center gap-1.5 rounded-full text-xs font-medium sm:text-sm",
                )}
              >
                <span>{t("contactCta")}</span>
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MobileNav;
