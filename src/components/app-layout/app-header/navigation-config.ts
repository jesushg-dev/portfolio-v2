import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Briefcase,
  Calendar,
  FileText,
  HeartHandshake,
  Layers,
  MonitorSmartphone,
  Radio,
  ScrollText,
  Server,
  Sparkles,
  User,
} from "lucide-react";

import { PUBLIC_PAGE_LIVE } from "@/lib/public-preview-pages";

export type StaticNavPath =
  | "/certificates"
  | "/curriculum-vitae"
  | "/timeline"
  | "/how-i-use-ai"
  | "/qa-collaboration"
  | "/uses"
  | "/now"
  | "/colophon";

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

export type NavItem = NavLinkItem | NavRouteItem;

export function homeSectionHref(sectionId: NavSectionId) {
  return { pathname: "/" as const, hash: `#${sectionId}` };
}

export interface NavGroup {
  id: "about" | "portfolio" | "process";
  icon: LucideIcon;
  items: NavItem[];
}

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
    items: [
      {
        kind: "route",
        id: "ai-workflow",
        href: "/how-i-use-ai",
        icon: Bot,
      },
      {
        kind: "route",
        id: "qa-collaboration",
        href: "/qa-collaboration",
        icon: HeartHandshake,
      },
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
        id: "colophon",
        href: "/colophon",
        icon: ScrollText,
        comingSoon: !PUBLIC_PAGE_LIVE.colophon,
      },
    ],
  },
];
