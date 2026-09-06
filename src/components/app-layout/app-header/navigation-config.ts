import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  FileText,
  Layers,
  MonitorSmartphone,
  Radio,
  ScrollText,
  Server,
  Sparkles,
  User,
} from "lucide-react";

import { resolveProcessPageIcon } from "@/lib/process-pages/process-page-icons";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";
import { PUBLIC_PAGE_LIVE } from "@/lib/public-preview-pages";

export type StaticNavPath =
  | "/certificates"
  | "/curriculum-vitae"
  | "/timeline"
  | "/uses"
  | "/now"
  | "/colophon"
  | "/stats";

export type NavSectionId =
  | "home"
  | "about"
  | "experience"
  | "skills"
  | "services"
  | "soft-skills"
  | "portfolio"
  | "contact";

export interface NavLinkItem {
  kind: "section";
  id: string;
  sectionId: NavSectionId;
  icon: LucideIcon;
}

export interface NavRouteItem {
  kind: "route";
  id: string;
  href: StaticNavPath;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export interface NavProcessItem {
  kind: "process";
  id: string;
  slug: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export type NavItem = NavLinkItem | NavRouteItem | NavProcessItem;

export function homeSectionHref(sectionId: NavSectionId) {
  return { pathname: "/" as const, hash: `#${sectionId}` };
}

export interface NavGroup {
  id: "about" | "portfolio" | "process";
  icon: LucideIcon;
  items: NavItem[];
}

const PROCESS_STATIC_ITEMS: NavItem[] = [
  {
    kind: "route",
    id: "uses",
    href: "/uses",
    icon: MonitorSmartphone,
    comingSoon: !PUBLIC_PAGE_LIVE.uses,
  },
  {
    kind: "route",
    id: "now",
    href: "/now",
    icon: Radio,
    comingSoon: !PUBLIC_PAGE_LIVE.now,
  },
  {
    kind: "route",
    id: "stats",
    href: "/stats",
    icon: BarChart3,
    comingSoon: !PUBLIC_PAGE_LIVE.stats,
  },
  {
    kind: "route",
    id: "colophon",
    href: "/colophon",
    icon: ScrollText,
    comingSoon: !PUBLIC_PAGE_LIVE.colophon,
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "about",
    icon: User,
    items: [
      { kind: "section", id: "about", sectionId: "about", icon: User },
      {
        kind: "section",
        id: "experience",
        sectionId: "experience",
        icon: Briefcase,
      },
      { kind: "section", id: "skills", sectionId: "skills", icon: Layers },
      { kind: "section", id: "services", sectionId: "services", icon: Server },
      {
        kind: "section",
        id: "soft-skills",
        sectionId: "soft-skills",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "portfolio",
    icon: Award,
    items: [
      {
        kind: "route",
        id: "certificates",
        href: "/certificates",
        icon: Award,
      },
      {
        kind: "route",
        id: "curriculum",
        href: "/curriculum-vitae",
        icon: FileText,
      },
      { kind: "route", id: "timeline", href: "/timeline", icon: Calendar },
    ],
  },
  {
    id: "process",
    icon: Bot,
    items: PROCESS_STATIC_ITEMS,
  },
];

export function processPagesToNavItems(
  pages: ProcessNavPage[],
): NavProcessItem[] {
  return pages.map((page) => ({
    kind: "process",
    id: page.id,
    slug: page.slug,
    icon: resolveProcessPageIcon(page.navIcon),
    label: page.menuTitle.trim() || page.slug,
    description: page.navDescription.trim(),
  }));
}

export function navGroupsForPublicSite(
  cvPublic: boolean,
  processPages: ProcessNavPage[] = [],
): NavGroup[] {
  const processItems: NavItem[] = [
    ...processPagesToNavItems(processPages),
    ...PROCESS_STATIC_ITEMS,
  ];

  const groups = NAV_GROUPS.map((group) =>
    group.id === "process" ? { ...group, items: processItems } : group,
  );

  if (cvPublic) return groups;
  return groups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !(item.kind === "route" && item.href === "/curriculum-vitae"),
    ),
  }));
}
