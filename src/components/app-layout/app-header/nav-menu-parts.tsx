"use client";

import type { FC, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Calendar, ChevronDown, ChevronRight, Mail } from "lucide-react";

import { LEGACY_PROCESS_NAV_ITEM_IDS } from "@/lib/process-pages/process-nav-page";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import HeaderCtaBar from "./header-cta-bar";
import { headerNavTriggerStyles } from "./toolbar-control-styles";
import {
  homeSectionHref,
  NAV_GROUPS,
  navGroupsForPublicSite,
  type NavItem,
} from "./navigation-config";
import { useProcessNavPages } from "../process-nav-pages";
import { usePublicCvVisible } from "../public-cv-visible";

function processItemDescription(
  stored: string,
  slug: string,
  t: ReturnType<typeof useTranslations>,
): string | null {
  if (stored) return stored;
  const legacyId = LEGACY_PROCESS_NAV_ITEM_IDS[slug];
  if (!legacyId) return null;
  const key = `${legacyId}.description`;
  const lookup = t as unknown as {
    has: (key: string) => boolean;
    (key: string): string;
  };
  return lookup.has(key) ? lookup(key) : null;
}

interface NavItemCardProps {
  item: NavItem;
  compact?: boolean;
}

function NavItemCard({ item, compact = false }: NavItemCardProps) {
  const t = useTranslations("global.header.nav.items");
  const tNav = useTranslations("global.header.nav");
  const Icon = item.icon;
  const label =
    item.kind === "process"
      ? item.label
      : (t as (key: string) => string)(`${item.id}.label`);
  const description =
    item.kind === "process"
      ? processItemDescription(item.description, item.slug, t)
      : (t as (key: string) => string)(`${item.id}.description`);
  const comingSoon = item.kind === "route" && item.comingSoon;

  const cardClassName = cn(
    "group grid w-full grid-cols-[auto_1fr_auto] gap-3 rounded-xl border border-transparent p-3 text-start transition-all",
    compact ? "items-center gap-2.5 p-2.5" : "items-start",
    comingSoon
      ? "cursor-default opacity-75"
      : "cursor-pointer hover:border-primary/15 hover:bg-primary/5 focus-visible:ring-ring/35 focus-visible:ring-2 focus-visible:outline-none",
  );

  const inner = (
    <>
      <span
        className={cn(
          "bg-primary/10 text-primary inline-flex shrink-0 items-center justify-center rounded-lg",
          compact ? "size-8" : "size-10",
        )}
      >
        <Icon aria-hidden className={compact ? "size-4" : "size-[1.1rem]"} />
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-foreground text-sm leading-none font-medium">
            {label}
          </span>
          {comingSoon ? (
            <Badge
              variant="secondary"
              className="h-5 shrink-0 px-1.5 text-[0.65rem]"
            >
              {tNav("comingSoon")}
            </Badge>
          ) : null}
        </span>
        {!compact && description ? (
          <span className="text-muted-foreground mt-1.5 block text-xs leading-relaxed">
            {description}
          </span>
        ) : null}
      </span>

      {!comingSoon ? (
        <ChevronRight
          aria-hidden
          className={cn(
            "text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
            !compact && "mt-0.5",
          )}
        />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
    </>
  );

  if (item.kind === "section") {
    return (
      <Link href={homeSectionHref(item.sectionId)} className={cardClassName}>
        {inner}
      </Link>
    );
  }

  if (comingSoon) {
    return <div className={cardClassName}>{inner}</div>;
  }

  if (item.kind === "process") {
    return (
      <Link href={processPageHref(item.slug)} className={cardClassName}>
        {inner}
      </Link>
    );
  }

  return (
    <Link href={item.href} className={cardClassName}>
      {inner}
    </Link>
  );
}

interface MegaMenuPanelProps {
  groupId: "about" | "portfolio" | "process";
}

export const MegaMenuPanel: FC<MegaMenuPanelProps> = ({ groupId }) => {
  const t = useTranslations("global.header.nav.groups");
  const tNav = useTranslations("global.header.nav");
  const cvPublic = usePublicCvVisible();
  const processPages = useProcessNavPages();
  const group = navGroupsForPublicSite(cvPublic, processPages).find(
    (entry) => entry.id === groupId,
  );

  if (!group) return null;

  const columnCount =
    group.items.length >= 4 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <>
      <div className="grid gap-8 md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] md:gap-10">
        <aside className="border-border/50 space-y-3 md:border-r md:pr-8">
          <p className="text-primary text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
            {t(`${groupId}.eyebrow`)}
          </p>
          <h3 className="text-foreground text-xl leading-snug font-semibold tracking-tight">
            {t(`${groupId}.headline`)}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(`${groupId}.description`)}
          </p>
        </aside>

        <div className="min-w-0">
          <p className="text-muted-foreground mb-3 text-[0.65rem] font-semibold tracking-[0.16em] uppercase">
            {tNav("explore")}
          </p>
          <div className={cn("grid grid-cols-1 gap-1", columnCount)}>
            {group.items.map((item) => (
              <NavItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <HeaderCtaBar className="mt-6" />
    </>
  );
};

interface MobileNavGroupProps {
  groupId: "about" | "portfolio" | "process";
  isOpen: boolean;
  onToggle: () => void;
}

export const MobileNavGroup: FC<MobileNavGroupProps> = ({
  groupId,
  isOpen,
  onToggle,
}) => {
  const t = useTranslations("global.header.nav.groups");
  const cvPublic = usePublicCvVisible();
  const processPages = useProcessNavPages();
  const group = navGroupsForPublicSite(cvPublic, processPages).find(
    (entry) => entry.id === groupId,
  );
  const Icon = group?.icon;

  if (!group) return null;

  return (
    <div className="border-border/60 border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="text-foreground hover:bg-accent/40 flex w-full cursor-pointer items-center justify-between px-1 py-3.5 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-2.5">
          {Icon ? <Icon aria-hidden className="text-primary size-4" /> : null}
          {t(`${groupId}.label`)}
        </span>
        <ChevronRight
          aria-hidden
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            isOpen && "rotate-90",
          )}
        />
      </button>
      {isOpen ? (
        <div className="pb-3 pl-1">
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const MobileContactActions: FC = () => {
  const t = useTranslations("global.header.nav");

  return (
    <div className="border-border/60 mt-2 space-y-2 border-t pt-4">
      <Link
        href={homeSectionHref("contact")}
        className="bg-primary/10 text-primary hover:bg-primary/15 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
      >
        <Mail aria-hidden className="size-4" />
        {t("contactCta")}
      </Link>
      <Link
        href="/schedule"
        className="border-border bg-background hover:bg-accent/40 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
      >
        <Calendar aria-hidden className="size-4" />
        {t("scheduleCta")}
      </Link>
    </div>
  );
};

export function NavMenuShell({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/60 bg-background/98 w-full rounded-2xl border shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="p-5 sm:p-6 lg:p-7">{children}</div>
    </div>
  );
}

interface DesktopNavTriggerProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export const DesktopNavTrigger: FC<DesktopNavTriggerProps> = ({
  label,
  isActive,
  onClick,
  onMouseEnter,
}) => (
  <button
    type="button"
    aria-expanded={isActive}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className={headerNavTriggerStyles(isActive)}
  >
    {label}
    <ChevronDown
      aria-hidden
      className={cn("size-3 transition-transform", isActive && "rotate-180")}
    />
  </button>
);

interface DesktopMegaMenuProps {
  activeGroup: (typeof NAV_GROUPS)[number]["id"] | null;
}

export const DesktopMegaMenu: FC<DesktopMegaMenuProps> = ({ activeGroup }) => {
  if (!activeGroup) return null;

  return (
    <div className="absolute inset-x-0 top-full z-50 hidden pt-3 lg:block">
      <div className="container mx-auto max-w-(--breakpoint-xl) px-2 md:px-6 lg:px-8">
        <NavMenuShell>
          <MegaMenuPanel groupId={activeGroup} />
        </NavMenuShell>
      </div>
    </div>
  );
};
