import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Briefcase,
  Calendar,
  FileText,
  HeartHandshake,
  Layers,
  Sparkles,
  User,
} from "lucide-react";

export type StaticNavPath =
  | "/certificates"
  | "/curriculum-vitae"
  | "/timeline"
  | "/how-i-use-ai"
  | "/qa-collaboration";

export type NavSectionId =
  | "home"
  | "about"
  | "experience"
  | "skills"
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
    ],
  },
];
